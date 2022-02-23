if(!window.successLoad){
    console.error('fackback for exception')
    if(onScriptError){
        setTimeout(() => onScriptError(null, true), 5000)
    }
}