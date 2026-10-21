from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import config
import functions
import socket
import logging
import time
import vlc
try:
    import RPi.GPIO as GPIO
    ES_RASPBERRY = True
except ImportError:
    ES_RASPBERRY = False

if ES_RASPBERRY:
    # Aquí haces el import específico o usas código de la Raspberry
    import picamera

s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
s.connect(("8.8.8.8", 80))
config.HOSTNAME=s.getsockname()[0]
s.close()

logger = logging.getLogger(config.APP_NAME)

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
            logger.warning("Playing audio")
            logger.warning(config.SIPAS_BACKEND_URL+"/v4/file/view/"+config.SIPAS_SESSION+"/"+ parameters["no_archivo"])
            vlc.MediaPlayer(config.SIPAS_BACKEND_URL+"/v4/file/view/"+config.SIPAS_SESSION+"/"+ parameters["no_archivo"]).play()
            result = {"response": "played"}
        self.send_response(200)
        self.send_header('Content-type', 'text/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode("utf-8"))

if __name__ == '__main__':
    http_server = HTTPServer((config.HOSTNAME, config.HOST_PORT), WebServer)
    logger.warning("SIPAS Pan-American School")
    logger.warning("Client version : %s" % config.CLIENT_VERSION)
    logger.warning("Server Starts - %s:%s" % (config.HOSTNAME, config.HOST_PORT))
    logger.warning(functions.send_api_message({"module":"devi","action":"device_conection_notify","session_uid":config.SIPAS_SESSION,"device_ip":config.HOSTNAME}))
    #functions.open_page()
    try:
        http_server.serve_forever()
    except KeyboardInterrupt:
        http_server.server_close()