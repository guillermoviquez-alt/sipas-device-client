const default_client_title = "SIPAS";
const default_client_version=4;
const defaul_client_language="en";
const api_public_url="https://sipas-backend.panam.ed.cr/v4/api_public/";
const api_private_v4_url="https://sipas-backend.panam.ed.cr/v4/api_private/";
const frontend_url="https://sipas.panam.ed.cr";
const backend_url="https://sipas-backend.panam.ed.cr";
const device_uid=getLocalVariable("device_uid");
let client_version=getLocalVariable("client_version");
let session_uid="35879dd4964fe6a6eb0b9c714e2cda2d";
let contained_sipas=false;
let pendientes=false;
let ubicacion_actual=window.location.pathname;
let session_info=null;
let me=null;
let access_right_system_module_list=null;
let full_access_right_system_module_list=null;
let open_module_code=null;
let open_action_code=null;
let url_parts=window.location.href.replace(frontend_url+"/","").split("/");
let intervals={
    car_queue:null,
    date:null,
    scan_timer:null
};

let relay_devices=[];

let keep_loader=false;
let editorFunctionOnClose=null;

let timer=10;
let aux_timer=timer;
let device_info=null;
let space_info=null;
let no_dispositivo=null;
let mostrando_persona=false;
let no_persona=null;
let persona=null;
let cantidad_hijos=0;
let cantidad_hijos_presionados=0;
let socket_server_ip="10.0.3.119"
let socket_server_port="8765"
const socket = new WebSocket("wss://"+socket_server_ip+":"+socket_server_port);
socket.addEventListener("open", (event) => {
    console.log("Conectado al servidor WebSocket.");

});

socket.addEventListener("message", (event) => {
    let mensaje_json=JSON.parse(event.data);
    console.log(mensaje_json);
    switch (mensaje_json["type"]){
        case "car-queue":
            switch (mensaje_json["message"]){
                case "add":
                    let contenido="";
                    $(mensaje_json["values"]).each(function(i,person){
                        contenido+="<div class='row' style='margin-bottom: 10px; border-bottom: 1px solid var(--PAS-yellow); padding-bottom: 10px;' id='salida_pendiente_"+person["no_registro"]+"'>"+
                            "<div class='col-8'>"+
                                "<p style='font-size: 28px; font-weight: bold; text-align: left;'>"+person["nombre"]+" "+person["apellido1"]+" "+person["apellido2"]+"</p>"+
                            "</div>"+
                            "<div class='col-4'>"+
                                "<p style='font-size: 28px; font-weight: bold; text-align: right;'>"+person["nivel_seccion"]+"</p>"+
                            "</div>"+
                        "</div>";
                    });
                    $("#listaSalidasCarroPendientes").html(contenido);
                    break;
                case "remove":
                    $(mensaje_json["values"]).each(function(i,person){
                        $("#salida_pendiente_"+person["no_registro"]).remove();
                    });
                    break;
                default:
                    break;
            }
            break;
        default:
            break;
    }
});

socket.addEventListener("error", (error) => {
    console.error("Error en WebSocket:", error);
});

socket.addEventListener("close", (event) => {
    console.log("Conexión cerrada:", event.code, event.reason);
});