import asyncio
from xml.sax import parseString

import websockets
import config


async def manejador(websocket):
    print("Cliente conectado")
    try:
        async for mensaje in websocket:
            print(f"Mensaje recibido: {mensaje}")
            # Enviar una respuesta de vuelta
            await websocket.send(f"Eco: {mensaje}")
    except websockets.exceptions.ConnectionClosed:
        print("Cliente desconectado")


async def iniciar_servidor():
    # Inicia el servidor WebSocket en localhost en el puerto 8765
    async with websockets.serve(manejador, config.HOSTNAME, config.SOCKET_PORT):
        print("Servidor WebSocket corriendo en ws://"+config.SOCKET_SERVER_IP+":"+str(config.SOCKET_PORT))
        await asyncio.Future()  # Mantiene el servidor en ejecución de forma indefinida

async def conectar():
    uri = "ws://"+config.SOCKET_SERVER_IP+":"+str(config.SOCKET_PORT)
    async with websockets.connect(uri) as websocket:
        # Enviar un mensaje al servidor
        mensaje = "Hola, servidor!"
        print(f"Enviando: {mensaje}")
        await websocket.send(mensaje)

        # Esperar la respuesta del servidor
        respuesta = await websocket.recv()
        print(f"Respuesta recibida: {respuesta}")