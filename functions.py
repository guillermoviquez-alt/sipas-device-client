import os
import webbrowser

import requests
import config
import RPi.GPIO as GPIO

def send_api_message(parameters):
    r=requests.post(url=config.SIPAS_BACKEND_URL+"/v4/api_private/", data=parameters)
    data = r.json()
    return data["data"]

def setupGPIO(gpio):
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    GPIO.setup(gpio, GPIO.OUT)

def open_page():
    file_name = 'web/index.html'
    absolute_path = os.path.abspath(file_name)
    webbrowser.open(f'file://{absolute_path}', new=2)