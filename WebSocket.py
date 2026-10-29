import asyncio
import websockets
import config
import functions
import json
import ssl

CONNECTED_CLIENTS = set()

async def manejador(websocket):
    config.LOGGER.warning("Cliente conectado")
    CONNECTED_CLIENTS.add(websocket)
    try:
        async for mensaje in websocket:
            config.LOGGER.warning(f"Mensaje recibido: {mensaje}")
            mensaje_json=json.loads(mensaje)
            response_json={}
            if mensaje_json["type"] == "car-queue":
                response_json["type"] = "car-queue"
                if mensaje_json["message"] == "start":
                    response_json["message"] = "add"
                    response_json["values"] = config.SERVER_CAR_QUEUE_STUDENT_LIST
                    await websocket.send(json.dumps(response_json))
                if mensaje_json["message"] == "remove":
                    response_json["message"] = "remove"
                    response_json["values"] = mensaje_json["values"]
                    for reg in mensaje_json["values"]:
                        items = [item for item in config.SERVER_CAR_QUEUE_STUDENT_LIST if int(item["no_registro"]) != reg["no_registro"]]
                        config.SERVER_CAR_QUEUE_STUDENT_LIST=items
                    recipients = CONNECTED_CLIENTS - {websocket}
                    for  recipient in recipients:
                        await recipient.send(json.dumps(response_json))


            #await websocket.send(f"Eco: {mensaje}")
    except websockets.exceptions.ConnectionClosed:
        config.LOGGER.warning("Cliente desconectado")
    finally:
        CONNECTED_CLIENTS.discard(websocket)


async def iniciar_servidor():
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ssl_context.load_cert_chain(certfile="../cert.pem", keyfile="../key.pem")
    async with websockets.serve(manejador, config.HOSTNAME, config.SOCKET_PORT,ssl=ssl_context):
        config.LOGGER.warning("Servidor WebSocket corriendo en wss://"+config.SOCKET_SERVER_IP+":"+str(config.SOCKET_PORT))
        config.SERVER_CAR_QUEUE_STUDENT_LIST=functions.send_api_message({"module":"devi","action":"car_queue_list","session_uid":config.SIPAS_SESSION,"device_ip":config.HOSTNAME})
        await asyncio.Future()  # Mantiene el servidor en ejecución de forma indefinida

async def conectar():
    uri = "wss://"+config.SOCKET_SERVER_IP+":"+str(config.SOCKET_PORT)
    async with websockets.connect(uri) as websocket:
        # Enviar un mensaje al servidor
        mensaje = "Hola, servidor!"
        config.LOGGER.warning(f"Enviando: {mensaje}")
        await websocket.send(mensaje)

        # Esperar la respuesta del servidor
        respuesta = await websocket.recv()
        config.LOGGER.warning(f"Respuesta recibida: {respuesta}")