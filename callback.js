

function f1(a,callback){

    
    return (callback(a),null)
}

f1(function(r,e){

    console.log("res "+r)
})