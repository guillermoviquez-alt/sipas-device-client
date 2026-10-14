from http.server import HTTPServer

import config
import functions
import WebServer
import socket
import logging

s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
s.connect(("8.8.8.8", 80))
config.HOSTNAME=s.getsockname()[0]
s.close()

logger = logging.getLogger(config.APP_NAME)

if __name__ == '__main__':
    http_server = HTTPServer((config.HOSTNAME, config.HOST_PORT), WebServer)
    logger.warning("SIPAS Pan-American School")
    logger.warning("Client version : %s" % config.CLIENT_VERSION)
    logger.warning("Server Starts - %s:%s" % (config.HOSTNAME, config.HOST_PORT))
    #logger.warning(functions.send_api_message({"module":"devi","action":"device_conection_notify","session_uid":config.SIPAS_SESSION,"device_ip":config.HOSTNAME}))
    functions.open_page()
    try:
        http_server.serve_forever()
    except KeyboardInterrupt:
        http_server.server_close()