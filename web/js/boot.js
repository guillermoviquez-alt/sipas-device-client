showLoader();
if( client_version !== null){
    showLog("log","Version found: "+client_version);
}else{
    showLog("warning","Version not found, using default: "+default_client_version);
    setLocalVariable("client_version",default_client_version);
    client_version=default_client_version;
}

if( session_uid !== null){
    showLog("log","Session found");
    $.when(publicAPICall({action:"session_info",session_uid:session_uid})).done(function(result){
        if(!result["error"]){
            if(result["data"]["authenticated"]==="t"){
                showLog("log","Active session found: ");
                session_info=result;
                showLog("log","Language setup: "+session_info["data"]["language"]);
                setLocalVariable("language",session_info["data"]["language"]);
                if(ubicacion_actual==="/v"+client_version+"/login" || ubicacion_actual==="/" || ubicacion_actual==="/v"+client_version+"/" || ubicacion_actual==="/login"){
                    window.location="/v"+client_version+"/"+result["data"]["user_device"];
                }
            }else{
                showLog("log","Login required");
                if(ubicacion_actual!=="/v"+client_version+"/login"){
                    window.location="/v"+client_version+"/login";
                }
                hideLoader();
            }
            //hideLoader();
        }else{
            showLog("error",result["error_detail"]);
            $.when(publicAPICall({action:"session_info"})).done(function(result){
                setLocalVariable("session_uid",result["data"]["uid"]);
                setLocalVariable("language",result["data"]["language"]);
                hideLoader();
            });
        }
    });
}else{
    showLog("warning","No active session");
    $.when(publicAPICall({action:"session_info"})).done(function(result){
        setLocalVariable("session_uid",result["data"]["uid"]);
        setLocalVariable("language",result["data"]["language"]);
        hideLoader();
        window.location="/v"+client_version+"/login";
    }).fail(function(){
        window.location="/v"+client_version+"/login";
    });
}