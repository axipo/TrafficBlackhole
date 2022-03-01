const pairTable = [
    '基本配置', 'Basic Configure',
    '并发数目', 'Parallel Tasks',
    '预定传输', 'Target Trafic Amount',
    '数据源', 'Data Source',
    '选择预定', 'Select Prepared',
    '自定义', 'Add Data Source',
    '统计信息', 'Statistics',
    '启动', 'Fire',
    '停止', 'Stop',
    '新增数据源', 'Add Data Source',
    '描述', 'Discription',
    '链接', 'Link',
    '体积', 'Size',
    '取消', 'Cancel',
    '确认', 'Confirm',
    '网速：', 'Speed: ',
    '流量：', 'Amount: ',
    '时长：', 'Time: ',
    '', '',
    '', '',
]



const messages = {
    "en": {
        "message": {
        }
    },
    "cn": {
        "message": {
        }
    }
}

for(let i = 0, len = pairTable.length; i < len; i++){
    let row = Math.floor(i / 2) + 2
    if(i % 2 === 0){
        messages.cn.message['s' + row] = pairTable[i]
    }else{
        messages.en.message['s' + row] = pairTable[i]
    }
}