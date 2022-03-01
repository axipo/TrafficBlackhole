function simpleUid() {
    return (
        Math.random().toString(16).slice(2) +
        Math.random().toString(16).slice(2) +
        Date.now()
    )
}

const initLang = 'en'

const i18n = new VueI18n({
  locale: initLang, // 设置地区
  messages, // 设置地区信息
})

let app = {
    i18n,
    data() {
        return {
            txt: '123',
            nTask: 4,
            trafficBudget:10,
            infTraffic:true,

            go: false,
            taskList: [],
            logs: [],
            maxLog: 20,

            historyLog: [],
            nHistory: 10,

            startTime:null,
            stopTime:null,
            now:Date.now(),
            rulerInitTimeDuration:10000,// 10s

            sources:[],
            currentSourceIndex:0,
            customSource:null,

            holdSourceText:null,
            holdSourceLink:null,
            holdSourceSize:null
        }
    },
    computed: {
        currentSource(){
            if(this.customSource){
                return this.customSource
            }
            if(this.sources.length === 0){
                return {
                    text:'loading',
                    size: 0
                }
            }
            return this.sources[this.currentSourceIndex]
        },
        sizePerReq(){
            return this.currentSource.size; //MB
        },
        speed() {
            let nlog = this.logs.length
            if (nlog <= 1) {
                return '-'
            }
            return ((this.logs[nlog - 1].amount - this.logs[0].amount) /
                (this.logs[nlog - 1].time - this.logs[0].time) * 1000
            ).toFixed(2) + 'MB/s'
        },
        amount() {
            let nlog = this.logs.length
            if (nlog <= 1) {
                return '-'
            }
            let amount = this.logs[nlog - 1].amount
            if (amount < 1024) {
                return amount + 'MB'
            } else if (amount < 1024 ** 2) {
                return (amount / 1024).toFixed(2) + 'GB'
            } else {
                return (amount / 1024 ** 2).toFixed(2) + 'TB'
            }
        },
        duration(){
            if(this.startTime === null){
                return '-'
            }
            let duration
            if(!this.go){
                duration = this.stopTime - this.startTime
            }else{
                duration = this.now - this.startTime
            }
            duration = duration / 1000

            let hours = Math.floor(duration / 3600)
            duration -= hours * 3600;
            let min = Math.floor(duration / 60)
            duration -= min* 60;
            let second = (duration).toFixed(2) + 's'
            hours = hours === 0 ? '' : hours + 'h'
            min = min === 0 ? '' : min + 'min'

            return hours + min + second
        },
        historyAndCurrentTasks() {
            let currentTask = JSON.parse(JSON.stringify(this.taskList));
            let result = this.historyLog.concat(currentTask).sort((a, b) => a.start - b.start)
            let minStart = Math.min(...result.map(v => v.start))
            let maxStop = this.go ? this.now : this.stopTime
            let rulerInitTimeDuration = this.rulerInitTimeDuration
            if (maxStop - minStart < rulerInitTimeDuration) {
                maxStop = minStart + rulerInitTimeDuration
            }
            result.forEach(v => {
                v.barStyle = {
                    'margin-left': (v.start - minStart) / (maxStop - minStart) * 100 + '%',
                    'width': ((v.stop || this.now) - v.start) / (maxStop - minStart) * 100 + '%',
                    'background-color':v.success || !v.stop ? '' : 'red'
                }
                v.className = 'progress-bar progress-bar-striped pbar'
                if(!v.stop){
                    v.className += ' progress-bar-animated'
                }
            })
            return result
        },
        rulerTime() {
            let historyAndCurrentTasks = this.historyAndCurrentTasks;
            let left  = historyAndCurrentTasks[0].start
            let right = this.go ? this.now : this.stopTime
                right = Math.max(right, left + this.rulerInitTimeDuration)

            return {
                left: left - this.startTime,
                right: right - this.startTime
            }
        },
        isInvalid(){
            return this.nTask <= 0 || 0 !== this.nTask - Math.trunc(this.nTask)
        },
        nTaskElementClass(){
            return {
                'input-group':true,
                'is-invalid': this.isInvalid
            }
        }
    },
    methods: {
        chooseSource(currentSourceIndex){
            this.currentSourceIndex = currentSourceIndex
            this.customSource = null
        },
        setCustomSource(){
            let customSource = {
                text:this.holdSourceText,
                link:this.holdSourceLink,
                size:parseInt(this.holdSourceSize)
            }
            this.customSource = customSource
        },
        loactionHash(task){
            let sources = this.currentSource
            return encodeURIComponent(JSON.stringify(({
                link:sources.link,
                uid:task.uid
            })))
        },
        adjust() {
            if (!this.go) {
                this.taskList.forEach(t => {
                    this.recordFinished(t.uid)
                })
                return
            }
            if (this.taskList.length > this.nTask) {
                this.taskList.slice(0, this.taskList.length - this.nTask)
                .forEach(t => {
                    this.recordFinished(t.uid)
                })
                return
            }
            while (this.taskList.length < this.nTask) {
                this.taskList.push({
                    start: this.now,
                    uid: simpleUid(),
                    stop:null //Stop is null
                })
            }
        },
        changeTaskAmount(diff) {
            this.nTask += diff;
            this.adjust()
        },
        changeNTask(e){
            let value = parseInt(e.target.value)
            if(value <= 0){
                return
            }
            this.nTask = value
        },
        fire() {
            this.go = true

            this.logs = []
            this.refreshTask()
            this.logs = [{
                time: this.now,
                amount: 0
            }]
            this.historyLog = []
            this.startTime = this.now
            this.adjust()
        },
        term() {
            this.go = false
            this.stopTime = this.now
            this.adjust()
        },
        addHistory(log) {
            this.historyLog.push(log)
            if (this.historyLog.length > this.nHistory && this.go) {
                this.historyLog.shift()
            }
        },
        refreshTask() {
            if(!this.go){
                return
            }

            this.now = Date.now()
            let nlog = this.logs.length
            let amount = nlog <= 1 ? 0 : this.logs[nlog - 1].amount
            if(!this.infTraffic && amount >= this.trafficBudget * 1024){
                this.term();
                return
            }
            setTimeout(() => {
                this.refreshTask()
            }, 200)
        },
        recordFinished(finishedUid, success){
            let finishedTask = this.taskList.filter(v => v.uid === finishedUid);
            if(finishedTask.length){
                finishedTask = finishedTask[0]
            }else{
                return
            }
            finishedTask.stop = this.now
            finishedTask.success = success
            this.addHistory(finishedTask)
            this.taskList = this.taskList.filter(v => v.uid !== finishedUid);
        }
    },
    created() {
        addEventListener('message', (e) => {
            if (!e.data.fromSandBox) {
                return
            }

            if(e.data.success){
                let nlog = this.logs.length;
                this.logs.push({
                    time: Date.now(),
                    amount: this.logs[nlog - 1].amount + this.sizePerReq
                })
                if (this.logs.length > this.maxLog) {
                    this.logs.shift()
                }
            }

            let finishedUid = e.data.value;
            this.recordFinished(finishedUid, e.data.success);
            this.$nextTick(() => {
                this.adjust()
            })
        })

        // this.refreshTask()

        fetch('sources.json')
            .then(v => v.json())
            .then(v => {
                this.sources = v
                this.currentSourceIndex = 0
            })
    },
    mounted(){
        this.$el.style.visibility = 'visible';
    }
};
new Vue(app).$mount('#app')

function setLang(e){
    let lang = e.target.dataset.lang
    document.querySelector('#about').dataset.lang = lang;
    if(lang === 'en'){
        i18n.locale = 'en'
    }else if(lang === 'cn'){
        i18n.locale = 'cn'
    }
}

document.querySelector('.lang').addEventListener('click', setLang)
document.querySelector('#about').dataset.lang = initLang;