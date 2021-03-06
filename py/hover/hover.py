#https://github.com/studioimaginaire/phue


#https://pypi.python.org/pypi/paho-mqtt/1.1
import paho.mqtt.client as mqtt
import json
from time import sleep
import logging as log
import sys,os
import cfg
from mqtt import mqtt_start
import requests

def hover_command(command):
    cmd = config["control"][command]
    if(cmd["type"] == "command"):
        topic = "valetudo/rockrobo/command"
        text_msg = cmd["message"]
    elif(cmd["type"] == "custom"):
        topic = "valetudo/rockrobo/custom_command"
        json_msg = {}
        json_msg["command"] = "zoned_cleanup",
        if("zone" in cmd):
            json_msg["zone_ids"] = []
            json_msg["zone_ids"].append(cmd["zone"])
        elif("zones" in cmd):
            json_msg["zone_ids"] = cmd["zones"]
        text_msg = json.dumps(json_msg)
    clientMQTT.publish(topic,text_msg)
    return

def hover_control(payload):
    sensor = json.loads(payload)
    log.info(f"click => {sensor['click']}")
    if(sensor['click'] == "on"):
        hover_command("start")
        log.info(f"hover_control> start")
    else:
        hover_command("charge")
        log.info(f"hover_control> going back to charge")
    return


def mqtt_on_message(client, userdata, msg):
    try:
        topic_parts = msg.topic.split('/')
        if(len(topic_parts) == 2):
            name = topic_parts[1]
            if(name == "hover button"):
                hover_control(msg.payload)
        else:
            log.debug(f"topic: {msg.topic} : heat")
    except Exception as e:
        log.error("mqtt_on_message> Exception :%s"%e)
    return

# -------------------- main -------------------- 
config = cfg.configure_log(__file__)

# -------------------- Mqtt Client -------------------- 
#will start a separate thread for looping
clientMQTT = mqtt_start(config,mqtt_on_message,True)




while(True):
    sleep(0.2)
    #The MQTT keeps looping on a thead
    #All there is to do here is not to exit
