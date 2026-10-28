import asyncio
from xml.sax import parseString

import websockets
import config
import functions


async def manejador(websocket):
    config.LOGGER.warning("Cliente conectado")
    try:
        async for mensaje in websocket:
            config.LOGGER.warning(f"Mensaje recibido: {mensaje}")
            # Enviar una respuesta de vuelta
            await websocket.send(f"Eco: {mensaje}")
    except websockets.exceptions.ConnectionClosed:
        config.LOGGER.warning("Cliente desconectado")


async def iniciar_servidor():
    # Inicia el servidor WebSocket en localhost en el puerto 8765
    async with websockets.serve(manejador, config.HOSTNAME, config.SOCKET_PORT):
        config.LOGGER.warning("Servidor WebSocket corriendo en ws://"+config.SOCKET_SERVER_IP+":"+str(config.SOCKET_PORT))
        config.SERVER_CAR_QUEUE_STUDENT_LIST=functions.send_api_message({"module":"devi","action":"device_conection_notify","session_uid":config.SIPAS_SESSION,"device_ip":config.HOSTNAME})
        await asyncio.Future()  # Mantiene el servidor en ejecución de forma indefinida

async def conectar():
    uri = "ws://"+config.SOCKET_SERVER_IP+":"+str(config.SOCKET_PORT)
    async with websockets.connect(uri) as websocket:
        # Enviar un mensaje al servidor
        mensaje = "Hola, servidor!"
        config.LOGGER.warning(f"Enviando: {mensaje}")
        await websocket.send(mensaje)

        # Esperar la respuesta del servidor
        respuesta = await websocket.recv()
        config.LOGGER.warning(f"Respuesta recibida: {respuesta}")