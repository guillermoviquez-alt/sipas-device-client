function update_clock(){
    $("#current_time").html(moment().format("HH:mm"));
    $("#current_date").html(moment().format("dddd[\n]Do MMM YYYY "));
}

function scanner_check(){
    showLoader();
    const valor=$("#codigo_escaner").val();
    $("#codigo_escaner").val("");
    $("#codigo_escaner").attr("disabled","");
    $.when(privatev4APICall({module:"peop",action:"find_people_by_badge_id",parameters:{id_biblioteca:valor}})).done(function(person){
        if(typeof person["data"]["no_persona"] !== "undefined"){
            persona=person["data"];
            no_persona=persona["no_persona"];
            if(persona["foto"]!==null){
                $("#foto_ingreso").css("display","");
                if( persona["foto"].startsWith("https://sipas-backend.panam.ed.cr")){
                    $("#foto_ingreso").attr("src",persona["foto"]);
                }else{
                    $("#foto_ingreso").attr("src",backend_url+"/v4/file/view/"+session_uid+"/"+((persona["foto"]).replaceAll('https://sipasv3.panam.ed.cr/fileView/','').replaceAll('https://sipas.panam.ed.cr/v4/file/view/','')));
                }
            }

            $("#nombre_ingreso").html(persona["nombre"]+" "+persona["apellido1"]);
            $("#titulo_registro_ingreso").css("display","");
            if((persona["es_administrativo"] || persona["es_profesor"]) ){
                if(no_dispositivo==="179" || no_dispositivo==="157"){
                    $("#boton_abrir_puerta").css("display","");
                    $("#boton_abrir_puerta").removeAttr("disabled");
                }
                if(no_dispositivo==="156"){
                    $("#boton_abrir_puerta2").css("display","");
                    $("#boton_abrir_puerta2").removeAttr("disabled");
                }
            }
            enter_registry();

            mostrando_persona=true;
            if(!persona["es_relativo"]){
                timer=5;
            }
            hideLoader();
        }else{
            showNotification("Wrong input data","error");
            hideLoader();
            search_clean();
        }
    }).fail(function(){
        search_clean();
        showNotification("Unexpected error occurred","error");
        hideLoader();
    });
}

function exit_button_clicked(){
    if(no_persona!==null){
        showLoader();
        $.when(privatev4APICall({module:"secu",action:"save_exit_registry",parameters:{no_persona:no_persona,sub_tipo:3,detalle:"ID Scan Exit",puerta:0,no_usuario:no_persona}})).done(function(registros){
            hijos_cant=$(".sale_hijo:checked").length;
            $(".sale_hijo:checked").each(function(i,e){
                $.when(privatev4APICall({module:"secu",action:"save_exit_registry",parameters:{no_persona:$(e).val(),sub_tipo:3,detalle:"ID Scan Exit",puerta:0,no_usuario:no_persona}})).done(function(){
                    if(hijos_cant>=i+1){
                        search_clean();
                    }
                });
            });
            if(hijos_cant===0){
                search_clean();
            }
            hideLoader();
        }).fail(function(error){
            console.log(error);
            showNotification("Unexpected error occurred","error");
            hideLoader();
            search_clean();
        });
    }
}



function search_clean(){
    $("#codigo_escaner").removeAttr("disabled");
    $("#boton_abrir_puerta").css("display","none");
    $("#boton_abrir_puerta2").css("display","none");
    $("#boton_marcar_salida_bloque").css("display","none");
    $("#boton_marcar_reingreso_bloque").css("display","none");
    $("#titulo_registro_ingreso").css("display","none");
    $("#registro_ingreso").html("");
    $("#foto_ingreso").attr("src","");
    $("#foto_ingreso").css("display","none");
    $("#nombre_ingreso").html("");
    $("#detalle_asistencia").html("");
    $("#hijos").html("");
    mostrando_persona=false;
    no_persona=null;
    timer=10;
    cantidad_hijos=0;
    cantidad_hijos_presionados=0;
    $("#timeout").html("10");
    document.getElementById("codigo_escaner").focus();
}

function fail_report(){
    console.log("Error");
    hideLoader();
}

function link_device(){
    setLocalVariable("device_uid",$("#codigo_link").val());
    window.location.reload();
}

function cambioIdioma(idioma){
    $(".lang_ES").css("display","none");
    $(".lang_EN").css("display","none");
    $(".lang_"+idioma).css("display","");
}

function enter_registry(){
    $.when(privatev4APICall({module:"secu",action:"save_enter_registry",parameters:{no_persona:no_persona,sub_tipo:3}})).done(function(registros){
        var fecha_hoy=moment().format("YYYY-MM-DD");
        persona["registro"] = registros["data"]["resultado"];
        persona["registro_previo"] = registros["data"]["registro"];
        if(persona["registro"]==="registro_previo"){
            can_leave=false;
            if(!persona["es_estudiante"]){
                $("#boton_marcar_salida_bloque").css("display","");

            }else{
                $(persona["registro_previo"]).each(function(i,e){
                    if((e["sub_tipo_registro"]==="2" && moment(e["fecha"]).diff(moment())<=0) || e["sub_tipo_registro"]==="1"){
                        can_leave=true;
                        console.log("Puede Salir");
                        $.when(privatev4APICall({module:"secu",action:"save_exit_registry",parameters:{no_persona:no_persona,sub_tipo:3,detalle:"ID Scan Exit",puerta:0,no_usuario:no_persona}})).done(function(registros){
                            $("#registro_ingreso").append("<p><i class='fas fa-walking fa-flip-horizontal' style='color: var(--PAS-orange);'></i>&nbsp;ID Scan Exit&nbsp;-&nbsp;"+moment(e["fecha"]).format("HH:mm:ss")+"</p>");
                            timer=5;
                        }).fail(function(error){
                            console.log(error);
                            hideLoader();
                            search_clean();
                        });
                    }else{
                        console.log("NO Puede Salir");
                    }
                });
                $.when(privatev4APICall({module:"sche",action:"person_schedule_by_date",parameters:{no_persona:persona["no_persona"],fecha:fecha_hoy}})).done(function(cursos){
                    $(cursos["data"]).each(function(i,curso){
                        $("#detalle_asistencia").append("<div style='font-size:11px;'><b>"+curso["seccion_nombre"]+"</b> -> "+curso["attendance_status"]+"</div>");
                        //console.log(curso);
                    });
                });
            }
            if(persona["es_relativo"]){
                $(persona["hijos_lista"]).each(function(i,e){
                    $("#hijos").append("<p><b class='lang_ES'>¿"+e["nombre"]+"&nbsp;sale tambien?</b><b class='lang_EN'>"+e["nombre"]+"&nbsp;exits too?</b>&nbsp;<input type='checkbox' checked class='sale_hijo' value='"+e["no_persona"]+"'></p>");
                });
            }
        }else{
            if(persona["es_relativo"]){
                cantidad_hijos=persona["hijos_lista"].length;
                $(persona["hijos_lista"]).each(function(i,e){
                    $("#hijos").append("<p><b class='lang_ES'>¿"+e["nombre"]+"&nbsp;ingresa tambien?</b><b class='lang_EN'>"+e["nombre"]+"&nbsp;enters too?</b><br><button class='btn btn-primary btn-sm' id='btn_ingreso_"+e["no_persona"]+"' onclick='guardarReingresoAux("+e["no_persona"]+");'><b class='lang_EN'>Yes</b><b class='lang_ES'>Si</b></button></p>");
                });
            }
            if(persona["es_estudiante"]){
                //Marcar asistencia a presente

                $.when(privatev4APICall({module:"sche",action:"person_schedule_by_date",parameters:{no_persona:persona["no_persona"],fecha:fecha_hoy}})).done(function(cursos){
                    $(cursos["data"]).each(function(i,curso){
                        if(curso["attendance_status"]==='No attendance taken'){
                            var parameters={
                                no_ciclo:curso["no_ciclo"],
                                no_nivel:curso["no_nivel"],
                                no_seccion:curso["no_seccion"],
                                no_persona:persona["no_persona"],
                                estado:0,
                                fecha:fecha_hoy,
                                no_dia:curso["no_dia"],
                                no_periodo:curso["no_periodo"],
                                parte:curso["parte"],
                                persona_registra:persona["no_persona"],
                                detalle:"Agregado por ID Scan",
                                registro_ligado:null
                            };
                            privatev4APICall({module:"sche",action:"person_insert_attendance_by_course",parameters:parameters});
                        }
                    });
                });
            }
        }
        $(persona["registro_previo"]).each(function(i,e){
            switch(e["sub_tipo_registro"]){
                case '0':
                    $("#registro_ingreso").append("<p><i class='fas fa-bus'></i>&nbsp;Bus arrival&nbsp;-&nbsp;"+moment(e["fecha"]).format("HH:mm:ss")+"</p>");
                    break;
                case '1':
                    $("#registro_ingreso").append("<p><i class='fas fa-car "+((e["tipo_registro"]==="1")?"fa-flip-horizontal":"")+" ' style='"+((e["tipo_registro"]==="1")?"color: var(--PAS-orange);":"color: var(--PAS-green);")+"'></i>&nbsp;Car Queue&nbsp;-&nbsp;"+moment(e["fecha"]).format("HH:mm:ss")+"</p>");
                    break;
                case '2':
                    $("#registro_ingreso").append("<p><i class='fas fa-walking "+((e["tipo_registro"]==="1")?"fa-flip-horizontal":"")+" ' style='"+((e["tipo_registro"]==="1")?"color: var(--PAS-orange);":"color: var(--PAS-green);")+"'></i>&nbsp;Early dismissal&nbsp;-&nbsp;"+moment(e["fecha"]).format("HH:mm:ss")+"</p>");
                    break;
                case '3':
                    $("#registro_ingreso").append("<p><i class='fas fa-walking "+((e["tipo_registro"]==="1")?"fa-flip-horizontal":"")+" ' style='"+((e["tipo_registro"]==="1")?"color: var(--PAS-orange);":"color: var(--PAS-green);")+"'></i>&nbsp;ID scan&nbsp;-&nbsp;"+moment(e["fecha"]).format("HH:mm:ss")+"</p>");
                    break;
                case '8':
                    $("#registro_ingreso").append("<p><i class='fas fa-walking "+((e["tipo_registro"]==="1")?"fa-flip-horizontal":"")+" ' style='"+((e["tipo_registro"]==="1")?"color: var(--PAS-orange);":"color: var(--PAS-green);")+"'></i>&nbsp;Security scan&nbsp;-&nbsp;"+moment(e["fecha"]).format("HH:mm:ss")+"</p>");
                    break;
                case '9':
                    $("#registro_ingreso").append("<p><i class='fas fa-car "+((e["tipo_registro"]==="1")?"fa-flip-horizontal":"")+" ' style='"+((e["tipo_registro"]==="1")?"color: var(--PAS-orange);":"color: var(--PAS-green);")+"'></i>&nbsp;Car Leave&nbsp;-&nbsp;"+moment(e["fecha"]).format("HH:mm:ss")+"</p>");
                    break;
                default:
                    break;
            }
        });
        cambioIdioma(persona["idioma_preferido"]);
        hideLoader();
    }).fail(function(error){
                console.log(error);
                showNotification("Error, try again","error");
                hideLoader();
                search_clean()
            });
}

function scan_access_device(){
    let codigo=$(this).val();
    showLoader();
    $("#codigo_escaner2").val("");
    $("#codigo_escaner2").attr("disabled","");
    $.when(privatev4APICall({module:"peop",action:"find_people_by_badge_id",parameters:{id_biblioteca:codigo}})).done(function(person){

        if(typeof person["data"]["no_persona"] !== "undefined"){
            $.when(privatev4APICall({module:"secu",action:"check_access_to_device",parameters:{no_persona:person["data"]["no_persona"],id_device:no_dispositivo}})).done(function(access){
                if(access["data"]["acceso"]==="si"){
                    persona=person["data"];
                    no_persona=persona["no_persona"];
                    $("#estado").removeClass("bg-danger");
                    $("#estado").addClass("bg-success");
                    $("#estado").html("Access granted<br>Acceso permitido");
                    activate_relay(device_info["ip"],23,10);
                    /*$.when(privatev4APICall({module:"devi",action:"activate_relay",parameters:{"gpio":gpio,time:timer,"ip":device_info["ip"],no_persona:no_persona}})).done(function(p){

                    });*/
                    intervals["scan_timer"]=setInterval(function(){
                        if(aux_timer===0){
                            $("#codigo_escaner2").removeAttr("disabled");
                            $("#estado").html("Access not granted<br>Acceso no permitido");
                            $("#estado").removeClass("bg-success");
                            $("#estado").addClass("bg-danger");
                            document.getElementById("codigo_escaner2").focus();
                            open=false;
                            aux_timer=timer;
                            clearInterval(intervals["scan_timer"]);
                        }else{
                            aux_timer--;
                        }
                        $("#timer").html(aux_timer);
                    },1000);
                }else{
                    $("#codigo_escaner2").removeAttr("disabled");
                    document.getElementById("codigo_escaner2").focus();
                }
                hideLoader();
            });

        }else{
            $("#codigo_escaner2").removeAttr("disabled");
            document.getElementById("codigo_escaner2").focus();
            hideLoader();
        }
    });
}

function activate_relay(ip,gpio,time){

    return $.ajax({url: "http://"+ip+":8000",type: "post",data: {action:"activate_relay",gpio:gpio,time:time},dataType: "json"});
}

function abrirPuerta(){
    $("#boton_abrir_puerta").attr("disabled","");
    $.when(activate_relay("10.0.3.2","23",5)).done(function(list){
        $("#boton_abrir_puerta").removeAttr("disabled");
        $("#codigo_escaner").removeAttr("disabled");
    }).fail(function(error){
        $("#boton_abrir_puerta").removeAttr("disabled");
        $("#codigo_escaner").removeAttr("disabled");
    });
}
function abrirPuerta2(){
    $("#boton_abrir_puerta2").attr("disabled","");
    $.when(activate_relay("10.0.3.119","17",1)).done(function(list){
        $("#boton_abrir_puerta2").removeAttr("disabled");
        $("#codigo_escaner").removeAttr("disabled");
    }).fail(function(error){
        $("#boton_abrir_puerta2").removeAttr("disabled");
        $("#codigo_escaner").removeAttr("disabled");
    });
}

function refrescarSalidasTempranas(){
    texthtml="";
    $.when(privatev4APICall({module:"secu",action:"early_dismissal_list",parameters:{}})).done(function(list){
        $(list["data"]).each(function(i,e){
            texthtml+="<div class='row' style='border-bottom: 1px solid gray;' id='salida_temprana_"+e["no_persona"]+"'>"+
                        "<div class='col-12' style='font-weight: bold;' id='salida_temprana_"+e["no_persona"]+"'>"+
                            "<div>"+moment(e["fecha"]).format("HH:mm")+" "+e["nombre_persona"]+" "+e["nombre_seccion"]+"&nbsp;<i class='fas fa-info-circle text-warning' onclick='mostrarInfoSalidaTemprana("+e["no_persona"]+");'></i><br>"+"</div>"+
                            ((e["encolado"]!==null)?"<p><i style='font-size:12px;'>"+e["encolado"]+"</i></p><button class='btn btn-primary btn-sm' onclick='dispatchbutton("+e["no_persona"]+");'>Dispatch</button><p>&nbsp;</p>":"")+
                        "</div>"+
                        "<div class='col-12' id='salida_temprana_"+e["no_persona"]+"_detalle' style='display:none;'>"+e["razon"]+"</div>"+
                    "</div>";

        });
        $("#lista_salidas_tempranas").html("");
        $("#lista_salidas_tempranas").append(texthtml);
        timer=300;
    });
}
function mostrarInfoSalidaTemprana(no_persona){
    if($("#salida_temprana_"+no_persona+"_detalle").css("display")==="none"){
        $("#salida_temprana_"+no_persona+"_detalle").css("display","block");
    }else{
        $("#salida_temprana_"+no_persona+"_detalle").css("display","none");
    }
}

function dispatchbutton(no_persona){
    $.when(privatev4APICall({module:"secu",action:"save_exit_registry",parameters:{no_persona:no_persona,sub_tipo:9,detalle:"Reception dispatch / car exit",puerta:0,no_usuario:no_persona}})).done(function(registros){
        refrescarSalidasTempranas();
    });
}

function startCorousel(){
    $("#slideshow_elements").html("");
    $.when(privatev4APICall({module:"devi",action:"slideshow_image_list",parameters:{no_dispositivo:no_dispositivo}})).done(function(result){
        $(result["data"]).each(function(i,e){
            $("#slideshow_elements").append("<div class='carousel-item "+((i===0)?"active":"")+"'><img src='"+backend_url+"/v4/file/view/"+session_info["data"]["uid"]+"/"+e["no_archivo"]+"' class='d-block' style='width:100%; max-height: calc( 100% - 100px ); border-radius: 15px; margin-left: auto; margin-right: auto;'></div>");
        });
    });

    $('#slideshow_carousel').carousel("cycle");
    hideLoader();
}

function startCarQueue(){
    $.when(privatev4APICall({module:"devi",action: "car_queue_list",parameters:{no_dispositivo:no_dispositivo}})).done(function (result) {
        contenido="";
        $(result["data"]).each(function(i,person){
            contenido+="<div class='row' style='margin-bottom: 10px; border-bottom: 1px solid var(--PAS-yellow); padding-bottom: 10px;' id='salida_pendiente_"+person["no_persona"]+"'>"+
                /*"<div class='col-2'>"+
                    "<img style='width:80px; border-radius: 5px; box-shadow: 0 0 5px 0 rgba(0, 0, 0, 1);' src='/v4/file/view/"+session_info["data"]["uid"]+"/"+person["foto"]+"'>"+
                "</div>"+*/
                "<div class='col-8'>"+
                    "<p style='font-size: 28px; font-weight: bold; text-align: left;'>"+person["nombre"]+" "+person["apellido1"]+" "+person["apellido2"]+"</p>"+
                "</div>"+
                "<div class='col-4'>"+
                    "<p style='font-size: 28px; font-weight: bold; text-align: right;'>"+person["nivel_seccion"]+"</p>"+
                "</div>"+
            "</div>";
        });
        $("#listaSalidasCarroPendientes").html(contenido);
        const socket = new WebSocket("ws://localhost:8765");

        // 2. Evento cuando se abre la conexión
        socket.addEventListener("open", (event) => {
          console.log("Conectado al servidor WebSocket.");

          // Enviar un mensaje al servidor
          socket.send(JSON.stringify({ type: "saludo", message: "¡Hola servidor!" }));
        });

        // 3. Evento para recibir mensajes del servidor
        socket.addEventListener("message", (event) => {
          console.log("Mensaje recibido:", event.data);
        });

        // 4. Evento si ocurre un error
        socket.addEventListener("error", (error) => {
          console.error("Error en WebSocket:", error);
        });

        // 5. Evento cuando se cierra la conexión
        socket.addEventListener("close", (event) => {
          console.log("Conexión cerrada:", event.code, event.reason);
        });
    });

}