import RPi.GPIO as GPIO
import os
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
import time
import socket
import webbrowser
import time
import requests
import logging
import vlc
import simple_sds011
import bme280
import smbus2
import board
import adafruit_sgp40
import adafruit_dht