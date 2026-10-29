import asyncio
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import config
import functions
import socket

import time
import vlc
import RPi.GPIO as GPIO
import WebSocket
from apscheduler.schedulers.background import BackgroundScheduler
import time
import datetime

s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
s.connect(("8.8.8.8", 80))
config.HOSTNAME=s.getsockname()[0]
s.close()

class WebServer(BaseHTTPRequestHandler):
    def do_HEAD(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.send_header('Access-Control-Allow-Origin','*')
        self.end_headers()

    def _redirect(self, path):
        self.send_response(303)
        self.send_header('Content-type', 'text/html')
        self.send_header('Location', path)
        self.end_headers()

    def do_GET(self):
        html = '''
           <html>
           <body 
            style="width:960px; margin: 20px auto;">
           <h1>SIPAS Client</h1>
           </body>
           </html>
        '''
        self.do_HEAD()
        self.wfile.write(html.encode("utf-8"))

    def do_POST(self):
        result={}
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode("utf-8")
        parameters = {}
        for post_element in post_data.split("&"):
            value = post_element.split("=")
            parameters[value[0]] = value[1]
        if parameters["action"] == "ping":
            print("Server asking for a ping")
            result = {"response": "pong"}
        if parameters["action"] == "activate_relay":
            functions.setupGPIO(int(parameters["gpio"]))
            GPIO.output(int(parameters["gpio"]), GPIO.HIGH)
            time.sleep(int(parameters["time"]))
            GPIO.output(int(parameters["gpio"]), GPIO.LOW)
            result = {"response": "activated"}
            print("" + parameters["gpio"] + " Activated")
        if parameters["action"] == "play_audio":
            config.LOGGER.warning("Playing audio")
            config.LOGGER.warning(config.SIPAS_BACKEND_URL+"/v4/file/view/"+config.SIPAS_SESSION+"/"+ parameters["no_archivo"])
            vlc.MediaPlayer(config.SIPAS_BACKEND_URL+"/v4/file/view/"+config.SIPAS_SESSION+"/"+ parameters["no_archivo"]).play()
            result = {"response": "played"}
        self.send_response(200)
        self.send_header('Content-type', 'text/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode("utf-8"))

if __name__ == '__main__':
    http_server = HTTPServer((config.HOSTNAME, config.HOST_PORT), WebServer)
    config.LOGGER.warning("SIPAS Pan-American School")
    config.LOGGER.warning("Client version : %s" % config.CLIENT_VERSION)
    config.LOGGER.warning("Server Starts - %s:%s" % (config.HOSTNAME, config.HOST_PORT))
    config.LOGGER.warning(functions.send_api_message({"module":"devi","action":"device_conection_notify","session_uid":config.SIPAS_SESSION,"device_ip":config.HOSTNAME}))
    #functions.open_page()
    scheduler = BackgroundScheduler()
    # Se ejecuta exactamente a las 00:00:00 de cada día
    # scheduler.add_job(functions.reiniciar_cola_carros, 'cron', hour=0, minute=0, second=0)
    # Se ejecuta exactamente a las 00:00:00 de cada día
    scheduler.add_job(functions.reiniciar_cola_carros, 'interval', seconds=60)
    scheduler.start()
    config.LOGGER.warning("Scheduler completo")
    if config.HOSTNAME == config.SOCKET_SERVER_IP:
        config.LOGGER.warning("Iniciando socket server")
        asyncio.run(WebSocket.iniciar_servidor())

    #WebSocket.conectar()


    try:
        config.LOGGER.warning("Iniciando web server")
        http_server.serve_forever()
    except KeyboardInterrupt:
        http_server.server_close()