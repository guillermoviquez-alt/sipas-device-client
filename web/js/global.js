//variable local
function setLocalVariable(key,value){
    window.localStorage.setItem(key,value);
}
function getLocalVariable(key){
    return window.localStorage.getItem(key);
}

//debug mode log
function showLog(type,message){
    switch(type){
        case "error":
            console.error(message);
            break;
        case "warning":
            console.warn(message);
            break;
        default:
            console.log(message);
    }
}

function publicAPICall(data){
    data["session_uid"]=session_uid;
    return $.ajax({url: api_public_url,type: "post",data: data,dataType: "json"});
}

function showLoader(){
    $("body").append("<div class='loader-container'><div class='loader'>"+
        "<div class='loader--dot'></div>"+
        "<div class='loader--dot'></div>"+
        "<div class='loader--dot'></div>"+
        "<div class='loader--dot'></div>"+
        "<div class='loader--dot'></div>"+
        "<div class='loader--dot'></div>"+
        "<div class='loader--text'></div></div></div>");
    $(".wrapper").addClass("basic-blur");
}
function hideLoader(){
    $(".wrapper").removeClass("basic-blur");
    $(".loader-container").remove();
}

function login(username, password,user_device="user") {
    //showLoader();
    if(username.length>0 && password.length>0){
        $.when(publicAPICall({action: "login", username: username, password: password})).done(function (result) {
            hideLoader();
            if (!result["error"]) {
                showNotification("Valid user found!!","success").then(() => {
                    window.location="/v"+client_version+"/"+user_device;
                });
            } else {
                showNotification("Error while try to login","error");
            }
        });
    }else{
        showNotification("You must type a valid username and password","error");
    }
}

function login_recover(){
    let contenido = "<div class='row'" +
        "<div class='col-md-12'>" +
        "<p style='margin-bottom:15px;'>Use an email registered on your SIPAS profile to receive your credentials</p>" +
        "<div style='margin-bottom:15px;' class='form-floating mb-3' id='pr_relacion_div' style='margin-top: 15px;'>" +
        "<input type='email' class='form-control' id='email_recover'>" +
        "<label>E-mail</label>" +
        "</div>" +
        "<div class='btn-group'>" +
        "<button class='btn btn-success' id=btn_login_recover_submit>Recover</button>" +
        "</div>" +
        "</div>" +
        "</div>";
    showModalWithoutSecurityCheck("Login recover",contenido);
    $("#btn_login_recover_submit").click(function(){
        const email_recover=$("#email_recover").val();
        if(email_recover.length!==0 && isValidEmail(email_recover)){
            $.when(publicAPICall({action: "login_recover", email:email_recover})).done(function (result) {
                if(!result["error"]){
                    showNotification("Valid email found, you will receive an email with your access credentials.","success").then(() => {
                        hideModal();
                        $("#username").val(email_recover);
                        $("#email_recover").val("");
                    });
                }else{
                    showNotification("Invalid Email","error");
                }
            });
        }else{
            showNotification("Invalid Email","error");
        }
    });
}

function showNotification(text, error_success = "error",timer=30000) {
    if(error_success==="confirm"){
        return swal({
            text:text,
            icon:"warning",
            buttons:{
                cancel: {
                  text: getTranslation("titulo_no"),
                  value: false,
                  visible: true,
                  className: "",
                  closeModal: true
                },
                confirm: {
                  text: getTranslation("titulo_si"),
                  value: true,
                  visible: true,
                  closeModal: true
                }
            }
        });
    }else{
        return swal({
            text:text,
            icon:error_success,
            timer: timer,
            timerProgressBar: true
        });
    }
}

function privatev4APICall(data,timeout=60000){
    data["session_uid"]=session_uid;
    return $.ajax({
        url: api_private_v4_url,
        type: "post",
        data: JSON.stringify(data),
        dataType: "json",
        contentType: "application/json",
        //beforeSend:showLoader,
        onError:hideLoader,
        //success:hideLoader,
        timeout: timeout,
        error:function(xhr, ajaxOptions, thrownError){
            hideLoader();
            console.log(thrownError);
            showNotification(thrownError,"error");
            if(thrownError==="timeout"){
                showNotification('Timeout when trying to get response from server','error',30000);
            }else{
                //showNotification(thrownError);
            }
            /**/
        }
    });
}

function saveTranslations(data){
    window.localStorage.setItem('translations', JSON.stringify(data));
}

function getTranslation(id){
    var traducciones_v=JSON.parse(window.localStorage.getItem('translations'));
    if(traducciones_v === null){
        return "[["+id+" text not found]]";
    }
    value=traducciones_v[id];
    if(typeof(value) === "undefined" || value==="undefined"){
        return "[["+id+" text not found]]";
    }
    return value;
}

function displayTranslations(){
    $("[lang-title]").each(function(i,e){
        $(e).attr("title",getTranslation($(e).attr("lang-title")));
    });
    $("[lang-placeholder]").each(function(i,e){
        $(e).attr("placeholder",getTranslation($(e).attr("lang-placeholder")));
    });
    $("[lang-replace]").each(function(i,e){
        $(e).html( $(e).html().replace("[["+$(e).attr("lang-replace")+"]]",getTranslation($(e).attr("lang-replace"))));
    });
}

function buildMainMenu(menus){
    let current_module = 'dash';
    let menu = "<li class='nav-item'><a id='module_dash' class='nav-link module_menu' aria-current='page' href='/v4/user/dash/mainac' >Dashboard</a></li>";
    $(menus).each(function(i,e){
        if(current_module!==e["module_code"]){
            if(current_module!=="dash"){
                menu+="</ul></li>";
            }
            current_module=e["module_code"];
            if(e["is_menu"]==="si"){
                menu+="<li class='nav-item dropdown'>"+
                    "<a id='module_"+e["module_code"]+"' class='nav-link dropdown-toggle module_menu' href='#"+e["module_name"]+"' role='button' data-bs-toggle='dropdown' aria-expanded='false'>"+getTranslation("module_"+e["module_name"])+"</a>"+
                    "<ul class='dropdown-menu'>"+
                    "<li><a class='dropdown-item' href='/v4/user/"+e["module_code"]+"/"+e["action_code"]+"'>"+(getTranslation(e["title"]).replace("Report - ", "<span class='badge bg-secondary'>Report</span>&nbsp;").replace("Reporte - ", "<span class='badge bg-secondary'>Reporte</span>&nbsp;"))+"</a></li>"
                    ;
            }


        }else{
            if(e["is_menu"]==="si"){
                menu+="<li><a class='dropdown-item' href='/v4/user/"+e["module_code"]+"/"+e["action_code"]+"'>"+(getTranslation(e["title"]).replace("Report - ", "<span class='badge bg-secondary'>Report</span>&nbsp;").replace("Reporte - ", "<span class='badge bg-secondary'>Reporte</span>&nbsp;").replace("Statistic - ", "<span class='badge bg-info'>Statistic</span>&nbsp;").replace("Estadistica - ", "<span class='badge bg-info'>Estadistica</span>&nbsp;"))+"</a></li>";
            }

        }
        //$("#main_menu_list").append("<li class='nav-item'><a id='module_"+e["code"]+"' class='nav-link module_menu' aria-current='page' href='#"+e["name"]+"' onclick='openModule(\""+e["code"]+"\",\""+e["passcode"]+"\",\"mainac\")'>"+getTranslation("module_"+e["name"])+"</a></li>");
    });
    if(session_info!==null){
        //$("#user_menu").append("<button class='btn btn-light' onclick='showPeopleProfile("+session_info["data"]["people_information"]["no_persona"]+")' ><i class='fa-regular fa-user'></i></button>");
        //$("#user_menu").append("<button class='btn btn-light' onclick='openModule(\"file\",\"bcb53bef2cc82a32608dae0f468a8d0c\",\"mainac\")'><i class='fa-regular fa-folder'></i></button>");
        //$("#user_display_name").html(session_info["data"]["people_information"]["nombre"]+" "+session_info["data"]["people_information"]["apellido1"]);
    }

    $("#main_menu_list").append(menu);
    open_module_code=getUrlParameterPos(2);
    open_action_code=getUrlParameterPos(3);
    let found = false;
    if (open_module_code!==null && open_action_code!==null) {
        $(menus).each(function (i, e) {
            if (e["module_code"] === open_module_code && e["action_code"] === open_action_code) {
                console.log("Abriendo modulo: " + open_module_code + " y accion: " + open_action_code);
                openModule(open_module_code, e['passcode'], open_action_code);
                found = true;
            }
        });
        if (!found) {
            openModule("dash", "28d7a5a47b5b4b845f68fc51f78fcb1a", "mainac");
            console.log("No se pudo abrir el modulo: " + open_module_code + " y accion: " + open_action_code);
            showNotification("The module and action was not found or you have no access to it", "error");
        }
    } else {
        //openModule("dash","28d7a5a47b5b4b845f68fc51f78fcb1a","mainac");
        if (session_info !== null) {
            found = false;
            $(menus).each(function (i, e) {
                if (e["module_code"] === session_info["data"]["module_code"] && e["action_code"] === session_info["data"]["action_code"]) {
                    console.log("Abriendo modulo: " + session_info["data"]["module_code"] + " y accion: " + session_info["data"]["action_code"]);
                    openModule(session_info["data"]["module_code"], e['passcode'], session_info["data"]["action_code"]);
                    found = true;
                }
            });
            if (!found) {
                openModule("dash", "28d7a5a47b5b4b845f68fc51f78fcb1a", "mainac");
                console.log("No se pudo abrir el modulo: " + session_info["module_code"] + " y accion: " + session_info["action_code"]);
                showNotification("The module and action was not found or you have no access to it", "error");
            }
        } else {
            openModule("dash", "28d7a5a47b5b4b845f68fc51f78fcb1a", "mainac");
        }

    }

}

function openModule(code,passcode,action){
    $.when(privatev4APICall({module:"syst",action:"open_module",parameters:{"module_code":code,"module_passcode":passcode,"action_code":action}})).done(function(result){
        if(result["data"]["action_content"]!==null){
            $.get(result["data"]["action_content"], function(data) {
                $("#main_body_content").html(data);
                document.title=getTranslation(""+result["data"]["title"]);
                $("#module_title").html(getTranslation(""+result["data"]["title"]));
                if(result["data"]["manual_page"]!==null && result["data"]["manual_page"]!=='' && result["data"]["manual_page"]!=='null'){
                    $("#module_help_button").attr("onclick","show_page_preview("+result["data"]["manual_page"]+")");
                    $("#module_help_button").removeAttr("disabled");
                }else{
                    $("#module_help_button").attr("disabled","");
                }
                if(result["data"]["ciclo_lectivo"]){
                    $("#ciclo_lectivo").html(result["data"]["ciclo_lectivo"]["nombre"]+" <button class='btn btn-sm btn-outline-primary check_security' module_action='schecl' onclick='show_change_school_year()'><i class='fas fa-rotate'></i></button>");
                }
                displayTranslations();
            });


        }else{
            if(result["data"]["function"]!==null){
                eval(result["data"]["function"]);
                document.title=getTranslation(""+result["data"]["title"]);
                $("#module_title").html(getTranslation(""+result["data"]["title"]));
                if(result["data"]["manual_page"]!==null && result["data"]["manual_page"]!=='' && result["data"]["manual_page"]!=='null'){
                    $("#module_help_button").attr("onclick","show_page_preview("+result["data"]["manual_page"]+")");
                    $("#module_help_button").removeAttr("disabled");
                }else{
                    $("#module_help_button").attr("disabled","");
                }
                if(result["data"]["ciclo_lectivo"]){
                    $("#ciclo_lectivo").html(result["data"]["ciclo_lectivo"]["nombre"]+" <button class='btn btn-sm btn-outline-primary check_security' module_action='schecl' onclick='show_change_school_year()'><i class='fas fa-rotate'></i></button>");
                }
                displayTranslations();
            }else{
                openModule("dash","28d7a5a47b5b4b845f68fc51f78fcb1a","mainac");
            }
        }

        if(typeof keep_loader!=="undefined" && keep_loader===true){

        }else{
            hideLoader();
        }
        checkSecurity();
    });
    return true;
}

function showEditor(title,content,show_function=function(){},pfunctionOnClose=null){
    $(".editor-body").find("textarea").each(function(i,ti){
        tinymce.remove("#"+$(ti).attr("id"));
    });
    $(".editor-header-content").html(title);
    if(typeof(pfunctionOnClose)==="function"){
        editorFunctionOnClose=pfunctionOnClose;
    }else{
        editorFunctionOnClose=null;
    }
    if(content.startsWith("/v4/modules")){
        return $.get(content, function(data) {
            $(".editor-body").html(data);
            displayTranslations();
            if(typeof show_function==='function'){
                $.when(show_function()).done(function(){
                    checkSecurity();
                    displayTranslations();
                    $(".editor-page-container").css("display","block");
                    hideLoader();
                }).fail(function(){
                    hideLoader();
                    showNotification("There was an error processing your request","error");
                });
            }
        });
    }else{
        $(".editor-body").html(content);
        displayTranslations();
        if(typeof show_function==='function'){
            $.when(show_function()).done(function(){
                checkSecurity();
                displayTranslations();
                $(".editor-page-container").css("display","block");
            }).fail(function(){
                hideLoader();
                showNotification("There was an error processing your request","error");
            });
        }
        checkSecurity();
    }
}

function hideEditor(){
    $(".editor-body").find("textarea").each(function(i,ti){
        tinymce.remove("#"+$(ti).attr("id"));
    });

    $(".editor-page-container").css("display","none");
    if(typeof(editorFunctionOnClose)==="function"){
        editorFunctionOnClose();
    }
}

function open_url_new_window(url){
    window.open(url);
}

function copy_text_to_clipboard(textToCopy) {
    try {
        navigator.clipboard.writeText(textToCopy);
        showNotification(getTranslation("titulo_texto_copiado"),"info");
    } catch (err) {
        showNotification(getTranslation("titulo_texto_no_copiado"),"error");
    }
}

function modify_share_url_expire_date(id,date){
    $.when(privatev4APICall({module:"syst",action:"modify_share_url_expire_date",parameters:{"id":id,"expire_date":date}})).done(function(result){

    });
}

function formatSIPASDate(value){
    return moment(value).format("YYYY-MM-DD");
}

function formatSIPASDateTime(value){
    let date=new Date(value);
    return date.toDateString();
}

function showModal(title,content,show_function=function(){},secondary=null,third=null){
    let id="general_modal";
    if(secondary!==null){
        id="secondary_modal";
    }
    if(third!==null){
        id="third_modal";
    }
    $("#"+id+"_title").html(title);
    $("#"+id+"_close_button").on("click",function(){
        $("#"+id+"_body").find("textarea").each(function(i,ti){
            tinymce.remove("#"+$(ti).attr("id"));
        });
        $("#"+id+"").hide();
        hideModal(secondary,third);
    });
    if(content.startsWith("/v4/modules")){
        return $.get(content, function(data) {
            $("#"+id+"_body").html(data);
            displayTranslations();
            if(typeof show_function==='function'){
                $.when(show_function()).done(function(){
                    checkSecurity();
                    displayTranslations();
                    $("#"+id).show();
                    hideLoader();
                }).fail(function(){
                    hideLoader();
                    showNotification("There was an error processing your request","error");
                });
            }
        });
    }else{
        $("#"+id+"_body").html(content);
        displayTranslations();
        if(typeof show_function==='function'){
            $.when(show_function()).done(function(){
                checkSecurity();
                displayTranslations();
                $("#"+id).show();
            }).fail(function(){
                hideLoader();
                showNotification("There was an error processing your request","error");
            });
        }
    }


}

function showFullScreenModal(title,content){
    var id="full_screen_modal";
    $("#full_screen_modal_title").html(title);
    $("#full_screen_modal_body").html(content);
    $("#full_screen_modal_close_button").on("click",function(){
        $("#full_screen_modal_body").find("textarea").each(function(i,ti){
            tinymce.remove("#"+$(ti).attr("id"));
        });
        $("#"+id+"").hide();
        hideFullScreenModal();
    });
    displayTranslations();
    $("#"+id).show();
    checkSecurity();
}

function hideFullScreenModal(){
    if(typeof(editorFunctionOnClose)==="function"){
        editorFunctionOnClose();
    }
    $("#full_screen_modal_body").find("textarea").each(function(i,ti){
        tinymce.remove("#"+$(ti).attr("id"));
    });
    $("#full_screen_modal_body").html("");
    $("#full_screen_modal").hide();
}


function showModalWithoutSecurityCheck(title,content,secondary=null,third=null){
    let id = "general_modal";
    if(secondary!==null){
        id="secondary_modal";
    }
    if(third!==null){
        id="third_modal";
    }
    $("#"+id+"_title").html(title);
    $("#"+id+"_body").html(content);
    $("#"+id+"_close_button").on("click",function(){
        $("#"+id+"_body").find("textarea").each(function(i,ti){
            tinymce.remove("#"+$(ti).attr("id"));
        });
        $("#"+id+"").hide();
    });
    displayTranslations();
    $("#"+id).show();
}

function hideModal(secondary=null,third=null){
    if(typeof(editorFunctionOnClose)==="function"){

        editorFunctionOnClose();
    }
    if(secondary===null && third===null){
        //tinymce.remove('textarea');
        $("#general_modal_body").find("textarea").each(function(i,ti){
            tinymce.remove("#"+$(ti).attr("id"));
        });
        $("#general_modal_body").html("");
        $("#general_modal").hide();
    }
    if(third===true){
        //tinymce.remove('textarea');
        $("#third_modal_body").find("textarea").each(function(i,ti){
            tinymce.remove("#"+$(ti).attr("id"));
        });
        $("#third_modal_body").html("");
        $("#third_modal").hide();
    }
    if(secondary===true){
        $("#secondary_modal_body").find("textarea").each(function(i,ti){
            tinymce.remove("#"+$(ti).attr("id"));
        });
        $("#secondary_modal").hide();
    }
}

function startHTMLEditorBasic(container_id){
    tinymce.init({
        selector: container_id,
        plugins: 'accordion anchor autolink charmap code emoticons image link lists media pagebreak searchreplace table visualblocks wordcount',
        toolbar: 'print undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | upload link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
        menubar: 'edit view insert format tools table custom custom2 custom3',
        license_key: 'gpl',
        language: ((getLocalVariable("language")==="es")?"es_MX":"en"),
        menu: {
          custom: { title: getTranslation("titulo_archivos"), items: 'custom_upload_file_gallery custom_select_file_gallery' },
          custom2: { title: getTranslation("titulo_traducir"), items: 'custom_translate_es custom_translate_en' },
          custom3: { title: getTranslation("titulo_plantilla"), items: 'custom_template_isa_primary custom_template_secondary_2 custom_template_secondary_4 custom_template_secondary_3 custom_template_secondary_1' }
        },
        paste_data_images: false,
        filemanager_title: "Search file",
        relative_urls: false,
        remove_script_host: false,
        images_upload_url: 'https://sipas-backend.panam.ed.cr/v4/modules/files/file_upload.php?single=true&session_uid='+getLocalVariable("session_uid"),
        files_upload_url: 'https://sipas-backend.panam.ed.cr/v4/modules/files/file_upload.php?single=true&session_uid='+getLocalVariable("session_uid"),
        images_file_types: 'jpg,jpeg,heic,png,webp',
        file_picker_types: 'file image media',
        block_unsupported_drop: false,
        height: 600,
        content_css: ['https://cdn.jsdelivr.net/npm/bootstrap@latest/dist/css/bootstrap.min.css'],
        paste_preprocess: (editor, args) => {
            if(args.content.startsWith('<img src="data:')){

                $("body").append("<div id='copied_image'></div>");
                $("#copied_image").append(args.content);
                const f=base64ToFile($("#copied_image").find("img").attr("src"),"image.png");
                $.when(send_files_to_upload([f],null)).done(function(result){
                    $(result).each(function(i,e){
                        if(e["error"]==="none"){
                            const pasteText= '<img style="max-width:100%;" src="'+backend_url+'/v4/file/view/'+getLocalVariable("session_uid")+'/'+e["id_file"]+'" alt="">';
                            editor.execCommand('mceInsertContent', false, pasteText);
                        }
                    });
                });
                args.content += '';
                $("#copied_image").remove();
            }

        },
        setup: function(editor) {
            editor.on('change', function(ev) {
                $(""+container_id+"").val(editor.getBody().innerHTML);
                $(""+container_id+"").change();

            });

            editor.ui.registry.addMenuItem('custom_translate_es', {
                text: getTranslation("titulo_traducir_espaniol"),
                onAction: function (_) {
                    if(editor.getBody().innerHTML.replace(/<[^>]*>?/gm, '').length>0 ){
                        showLoader();
                        $.when(translate_text(editor.getBody().innerHTML,'es')).done(function(result){
                            editor.execCommand('mceInsertContent', false, "<br><b>------</b><br>");
                            editor.execCommand('mceInsertContent', false, result["data"]);
                            hideLoader();
                        });
                    }else{
                        showNotification("Content can not be empty","warning");
                    }

                    //editor.execCommand('mceInsertContent', false, "Esta función aun esta en desarrollo");
                }
            });

            editor.ui.registry.addMenuItem('custom_translate_en', {
                text: getTranslation("titulo_traducir_ingles"),
                onAction: function (_) {
                    if(editor.getBody().innerHTML.replace(/<[^>]*>?/gm, '').length>0 ){
                        showLoader();
                        $.when(translate_text(editor.getBody().innerHTML,'en')).done(function(result){
                            editor.execCommand('mceInsertContent', false, "<br><b>------</b><br>");
                            editor.execCommand('mceInsertContent', false, result["data"]);
                            hideLoader();
                        });
                    }else{
                        showNotification("Content can not be empty","warning");
                    }

                    //editor.execCommand('mceInsertContent', false, "Esta función aun esta en desarrollo");
                }
            });

            editor.ui.registry.addMenuItem('custom_template_isa_primary', {
                text: getTranslation("titulo_custom_template_isa_primary"),
                onAction: function (_) {
                    showLoader();
                    $.when(get_custom_template(1214)).done(function(result){
                        $("#title").val(result["data"]["titulo_en"]);
                        $("#titulo").val(result["data"]["titulo_en"]);
                        if(result["data"]["texto_en"]!==null){
                            editor.execCommand('mceInsertContent', false, result["data"]["texto_en"]);
                        }
                        hideLoader();
                    });
                }
            });

            editor.ui.registry.addMenuItem('custom_template_secondary_1', {
                text: getTranslation("titulo_custom_template_secondary_1"),
                onAction: function (_) {
                    showLoader();
                    $.when(get_custom_template(1220)).done(function(result){
                        $("#title").val(result["data"]["titulo_en"]);
                        $("#titulo").val(result["data"]["titulo_en"]);
                        if(result["data"]["texto_en"]!==null){
                            editor.execCommand('mceInsertContent', false, result["data"]["texto_en"]);
                        }
                        hideLoader();
                    });
                }
            });

            editor.ui.registry.addMenuItem('custom_template_secondary_2', {
                text: getTranslation("titulo_custom_template_secondary_2"),
                onAction: function (_) {
                    showLoader();
                    $.when(get_custom_template(1221)).done(function(result){
                        $("#title").val(result["data"]["titulo_en"]);
                        $("#titulo").val(result["data"]["titulo_en"]);
                        if(result["data"]["texto_en"]!==null){
                            editor.execCommand('mceInsertContent', false, result["data"]["texto_en"]);
                        }
                        hideLoader();
                    });
                }
            });

            editor.ui.registry.addMenuItem('custom_template_secondary_3', {
                text: getTranslation("titulo_custom_template_secondary_3"),
                onAction: function (_) {
                    showLoader();
                    $.when(get_custom_template(1222)).done(function(result){
                        $("#title").val(result["data"]["titulo_en"]);
                        $("#titulo").val(result["data"]["titulo_en"]);
                        if(result["data"]["texto_en"]!==null){
                            editor.execCommand('mceInsertContent', false, result["data"]["texto_en"]);
                        }
                        hideLoader();
                    });
                }
            });

            editor.ui.registry.addMenuItem('custom_template_secondary_4', {
                text: getTranslation("titulo_custom_template_secondary_4"),
                onAction: function (_) {
                    showLoader();
                    $.when(get_custom_template(1223)).done(function(result){
                        $("#title").val(result["data"]["titulo_en"]);
                        $("#titulo").val(result["data"]["titulo_en"]);
                        if(result["data"]["texto_en"]!==null){
                            editor.execCommand('mceInsertContent', false, result["data"]["texto_en"]);
                        }
                        hideLoader();
                    });
                }
            });



            editor.ui.registry.addMenuItem('custom_upload_file_gallery', {
                text: getTranslation("titulo_cargar_archivo"),
                onAction: function (_) {
                    let EditorUploadCallFunc = function (link,type,name=null) {
                        let text = "";
                        switch (type) {
                            case 'image/png':
                                text = "<img src='" + link + "' style='width: 100%;' alt=''>";
                                break;
                            case 'image/jpeg':
                                text = "<img src='" + link + "' style='width: 100%;' alt=''>";
                                break;
                            case 'video/mp4':
                                text = "<video style='width: 100%; height: auto;' controls><source src='" + link + "' type='" + type + "'></source></video>";
                                break;
                            case 'video/quicktime':
                                text = "<video style='width: 100%; height: auto;' cotrols><source src='" + link + "' type='" + type + "'></source></video>";
                                break;
                            /*case 'application/pdf':
                                text = "<iframe style='width: 100%; height: 400px;' src='/assets/pdfjs/web/viewer.html?file=" + link + "'></iframe>";
                                break;*/
                            default:
                                //selected=$(tinyMCE.activeEditor.selection.getNode()).html();
                                let selected=tinyMCE.activeEditor.selection.getContent();
                                text = "<a href='" + link + "' target='_blank'>" + ((selected!==null && selected!=='')?selected:((name!==null)?name:link)) + "</a>";
                                break;
                        }
                        editor.insertContent(text);
                        hideModal(null,true);
                    };
                    showUploadFile();
                }
            });
            editor.ui.registry.addMenuItem('custom_select_file_gallery', {
                text: getTranslation("titulo_seleccionar_archivo"),
                onAction: function (_) {
                    let selectCallFunc = function (link,type,name=null) {
                        let text = "";
                        switch (type) {
                            case 'image/png':
                                text = "<img src='" +frontend_url+ link + "' style='width: 100%;'>";
                                break;
                            case 'image/jpeg':
                                text = "<img src='" +frontend_url + link + "' style='width: 100%;'>";
                                break;
                            case 'video/mp4':
                                text = "<video style='width: 100%; height: auto;' controls><source src='" +frontend_url + link + "' type='" + type + "'></source></video>";
                                break;
                            case 'video/quicktime':
                                text = "<video style='width: 100%; height: auto;' cotrols><source src='" +frontend_url + link + "' type='" + type + "'></source></video>";
                                break;
                            /*case 'application/pdf':
                                text = "<iframe style='width: 100%; height: 400px;' src='/assets/pdfjs/web/viewer.html?file=" + link + "'></iframe>";
                                break;*/
                            default:
                                let selected=tinyMCE.activeEditor.selection.getContent();
                                text = "<a href='" +frontend_url + link + "' target='_blank'>" + ((selected!==null && selected!=="")?selected:((name!==null)?name:link)) + "</a>";
                                break;
                        }
                        editor.insertContent(text);
                        hideModal(true,null);
                    };
                    showFilePicker();
                    //mostrarURLVentana("/php/SYS/fileExplorer.php", selectCallFunc);
                }
            });
        }
    });
}

function validateEmailFormat(email){
    return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
}
function validateTelFormat(tel){
    tel=tel.replaceAll(' ','').replaceAll('-','');
    if(tel.length===8){
        tel="+506"+tel;
    }
    var regEx = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
    //if (!tel.match(regEx)) return false;
    return true;
}

function startCalendar(element,parameters){
    let data=parameters;
    let calendarEl = document.getElementById(element);
    let periodo=null;
    data["session_uid"]=getLocalVariable("session_uid");
    data["module"]="cale";
    //periodo=(typeof parameters["tipo_calendario"] !=="undefined")?parameters["tipo_calendario"]:"listWeek";//"timeGridWeek";
    if(typeof parameters["categoria"]=== "undefined"){
         data["categoria"]="primaria";
    }
    if(typeof parameters["no_persona"]=== "undefined"){
        data["no_persona"]="100000";
    }
    if(typeof parameters["periodo"]!== "undefined"){
        periodo=parameters["periodo"];
    }
    let  calendar = new FullCalendar.Calendar(calendarEl, {
        themeSystem: 'bootstrap5',
        initialView: periodo,
        firstDay:1,
        height: 'auto',
        slotMinTime: '6:00',
        slotMaxTime: '16:00',
        slotDuration: '0:20:00',
        nowIndicator: true,
        displayEventTime: false,
        locale: getLocalVariable("language"),
        schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
        views: {
            timeGridFourDay: {
              type: 'timeGridWeek',
              //duration: { days: 5 },
              buttonText: '5 day',
              hiddenDays: [6,0]
            }
        },
        businessHours: {
            daysOfWeek: [ 1, 2, 3, 4 ,5],
            startTime: '7:00',
            endTime: '16:00'
        },
        headerToolbar: {
            left: 'prev,next',
            center: 'dayGridMonth,timeGridWeek,listWeek',
            right: 'title'
        },
        events: {
            url: api_private_v4_url,
            method: 'POST',
            extraParams: data,
            failure: function() {
              showNotification('there was an error while fetching events!','error');
            }
        },
        eventContent: function( info ) {
            return {html:((info.event.allDay)?""+info.event.title+"":moment(info.event.start).format("HH:mm")+" "+info.event.title)};
        },
        eventClick:function(info){
            if(info.event.extendedProps.tipo_evento==="course"){
                show_class_students_list(info.event.extendedProps.no_ciclo,info.event.extendedProps.no_nivel,info.event.extendedProps.no_seccion);
                $(".editor-page-container").css("z-index",'1055');
            }
            if(info.event.extendedProps.tipo_evento==="partido"){
                showMatchPublicFromEvent(info.event.id);

            }
            if(info.event.extendedProps.tipo_evento==="gira"){
                showFieldtripPublicFromEvent(info.event.id);

            }
            if(info.event.extendedProps.tipo_evento==="institucional"){
                if( typeof event_click_func==="function"){
                    //event_click_func(info.event.id);
                }
            }
            if(info.event.extendedProps.tipo_evento==="evento"){
                if( typeof event_click_func==="function"){
                    showLoader();
                    event_click_func(info.event.id);
                }
            }
        },
        dateClick:function(info) {
            if( typeof day_click_func==="function"){
                day_click_func(info.dateStr,info);
            }
        }
    });

    calendar.render();
    return calendar;
}


function getUrlParameterPos(pos) {
    let sPageURL = window.location.href.replace(frontend_url+"/","");
    let sURLVariables = sPageURL.split('/');
    return (typeof sURLVariables[pos]=== 'undefined')? false:decodeURIComponent(sURLVariables[pos]);
}

function sendAccessCredentials(no_persona){
    swal({
        text:getTranslation("texto_desea_enviar_credenciales"),
        icon:"warning",
        buttons:{
            cancel: {
              text: getTranslation("titulo_no"),
              value: false,
              visible: true,
              className: "",
              closeModal: true
            },
            confirm: {
              text: getTranslation("titulo_si"),
              value: true,
              visible: true,
              closeModal: true
            }
        }
    }).then((result) => {
        if (result) {
            $.when(privatev4APICall({module:"syst",action:"send_access_credentials",parameters:{"no_persona":no_persona}})).done(function(result2){
                showNotification("Credentials sent!","info");
            });
        }
    });
}

function checkSecurity(){
    $(".check_security").each(function(index,item){
        let access=false;
        $(full_access_right_system_module_list).each(function(index2, item2){
            if($(item).attr("module_action")===item2["action_code"]){
                access=true;
            }
        });
        if(!access){
            if($(item).hasClass("read-only")){
                if($(item).hasClass("security_exceptions")){
                    let can_change=false;
                    $($(item).attr("can_change").split(",")).each(function(index3,item3){
                        if(item3!=='' && item3!=='null' && item3!==null){
                            if(item3===me["no_persona"]){
                                can_change=true;
                            }
                        }
                    });
                    if(!can_change){
                        $(item).attr("disabled","");
                    }
                }else{
                    $(item).attr("disabled","");
                }
            }else{
                $(item).remove();
            }

        }
    });
}

function checkSecurity_2(){
    return $.when(privatev4APICall({module:"syst",action:"full_access_right_system_module_list"}),privatev4APICall({module:"peop",action:"my_information",parameters:{}})).done(function(result1,result2){
        $(".check_security").each(function(index,item){
            let access=false;
            $(result1[0]["data"]).each(function(index2, item2){
                if($(item).attr("module_action")===item2["action_code"]){
                    access=true;
                }
            });
            if(!access){
                if($(item).hasClass("read-only")){
                    if($(item).hasClass("security_exceptions")){
                        let can_change=false;
                        $($(item).attr("can_change").split(",")).each(function(index3,item3){
                            if(item3!=='' && item3!=='null' && item3!==null){
                                if(item3===result2[0]["data"]["no_persona"]){
                                    can_change=true;
                                }
                            }
                        });
                        if(!can_change){
                            $(item).attr("disabled","");
                        }
                    }else{
                        $(item).attr("disabled","");
                    }
                }else{
                    $(item).remove();
                }

            }
        });
        //hideLoader();
    });

}

function isValidEmail(email){
    var regEx = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    return email.match(regEx);

}

function isValidtelephone(tel){
    if(tel.length===8){
        tel="+506"+tel;
    }
    const regEx = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
    return tel.match(regEx);

}

function showModalFilePreview(id_file){
    //contenido="<div class='col-12' style='text-align:center;'><iframe style='width:100%; height:600px;' src='/v4/file/view/"+getLocalVariable("session_uid")+"/"+id_file+"'></iframe></div>";
    //showModal("File Preview",contenido,"secondary");
    showLoader();
    $.when(privatev4APICall({module:"file",action:"file_info_content",parameters:{"id_file":id_file}})).done(function(result){
        let content;
        if (result["data"].length > 0 && result["data"] !== "" && result["data"] !== null && result["data"] !== []) {
            let title = result["data"][0]["nombre"];
            let mime = (result["data"][0]["mime_type"]).split("/");
            if (mime[0] === "image") {
                content = "<img style='max-width:100%;' src='"+backend_url+"/v4/file/view/" + session_uid + "/" + id_file + "' alt=''>";
            }
            if (mime[0] === "audio") {
                content = "<audio controls> <source src='"+backend_url+"/v4/file/view/" + session_uid + "/" + id_file + "'></audio>";
            }
            if (mime[0] === "video") {
                content = "<video controls> <source src='"+backend_url+"/v4/file/view/" + session_uid + "/" + id_file + "'></audio>";
            }
            if (mime[0] === "text") {
                content = "<iframe style='width:100%; min-height:700px;' src='/assets/viewerjs/#"+backend_url+"/v4/file/view/" + session_uid + "/" + id_file + "'></iframe>";
            }
            if (mime[1] === "vnd.openxmlformats-officedocument.presentationml.presentation") {
                content = "<iframe style='width:100%; min-height:700px;' src='https://view.officeapps.live.com/op/embed.aspx?src="+backend_url+"/v4/file/view/" + session_uid + "/" + id_file + "'></iframe>";
            }
            if (mime[1] === "vnd.openxmlformats-officedocument.wordprocessingml.document") {
                content = "<iframe style='width:100%; min-height:700px;' src='https://view.officeapps.live.com/op/embed.aspx?src="+backend_url+"/v4/file/view/" + session_uid + "/" + id_file + "'></iframe>";
            }
            if (mime[1] === "pdf") {
                content = "<iframe style='width:100%; min-height:700px;' src='/assets/pdfjs/web/viewer.html?file="+backend_url+"/v4/file/view/" + session_uid + "/" + id_file + "'></iframe>";
            }
            showModal(title, content,function(){}, "secondary");
            hideLoader();
        } else {
            showNotification("Error while getting file!!", "error");
            hideLoader();
        }
    });
}

function updateModuleConfigOption(id,value){
    $.when(privatev4APICall({module:"syst",action:"update_module_config_value",parameters:{id:id,value:value}})).done(function(result1){

    });
}

function showFooterLoader(){$('#loader_footer').css("display","");}

function hideFooterLoader(){$('#loader_footer').css("display","none");}

function show_ical_share(){
    showLoader();
    $.ajax({
        url:"/v4/modules/files/file_share.php",
        dataType:"text",
        success:function(content){
            const link=frontend_url+session_uid;
            showEditor("Calendar subscribe link",content,function(){
                $("#file_preview_img").remove();
                $("#file_share_data_expire_time").parent().remove();
                $("#file_share_data_url").val(link);
                $("#file_share_data_qr_code").qrcode({
                    render: "image",
                    text: link
                });
                $("#file_share_data_open_button").attr("onclick","open_url_new_window('"+link+"')");
                $("#file_share_data_copy_button").attr("onclick","copy_text_to_clipboard('"+link+"')");
            });

        }
    });
}

function printElement(element){
    let newWin=window.open('','Print-Window');
    newWin.document.open();
    newWin.document.write('<html>'+'<link href="/assets/bootstrap/css/bootstrap.css" rel="stylesheet" />'+
            '<link href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap" rel="stylesheet" async>'+
        "<link href='https://fonts.googleapis.com/css?family=Lato:400,700' rel='stylesheet' type='text/css'>"+
        '<link href="https://cdn.jsdelivr.net/npm/bootstrap-table@latest/dist/bootstrap-table.min.css" rel="stylesheet">'+
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@latest/font/bootstrap-icons.min.css">'+
        '<link href="/v4/css/main.css?v=4.0.1" rel="stylesheet" />'+
            '<body onload="window.print()"><div class="wrapper" style="background-color:white; font-size:10px; overflow:unset;"><div class="container-fluid">'+$(element).html()+'</div></div></body></html>');
    newWin.document.close();
    setTimeout(function(){newWin.close();},10);
}

function table_selection_google_drive_export(table_id){
    const element=$("#" + table_id);
    const selection = $(element).bootstrapTable('getSelections');
    const visible_columns = $(element).bootstrapTable('getVisibleColumns');
    if(selection.length>0){
        showLoader();
        $.when(privatev4APICall({module:"syst",action:"table_selection_google_drive_export",parameters:{data:selection,columns:visible_columns}})).done(function(result1){
            hideLoader();
            window.open("https://docs.google.com/spreadsheets/d/"+result1["data"]["id"],'_blank');
        });
    }else{
        showNotification("Nothing selected!!","error");
    }

}

function check_system_right(me,code){
    let has_access = false;
    $(Object.keys(me["system_rights"])).each(function(i,e){
        if(me["system_rights"][e]["action_code"]===code){has_access=true; return true;}
    });
    return has_access;
}

function dayLetterFromDate(date,full=false){
    switch(moment(date).format("ddd")){
        case "Mon":
            return "L";
        case "Tue":
            return "K";
        case "Wed":
            return "M";
        case "Thu":
            return "J";
        case "Fri":
            return "V";
        case "Sat":
            return "S";
        case "Sun":
            return "D";

    }
}

function getDatesInRange(startDate, endDate) {
  let dateArray = [];
    let currentDate = moment(startDate);
    let stopDate = moment(endDate);

  while (currentDate <= stopDate) {
    dateArray.push(currentDate.format('YYYY-MM-DD'));
    currentDate.add(1, 'days');
  }

  return dateArray;
}