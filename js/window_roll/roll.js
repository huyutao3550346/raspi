const fs = require('fs');
const {logger} = require('./logger.js')
const mqtt = require('./mqtt.js')
const http = require('http');
const { stringify } = require('querystring');
const config = JSON.parse(fs.readFileSync(__dirname+'/config.json'))

let control = false
let position = 50
let target_position = 50
let is_window_closed = false

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function roll_down_up(){
  mqtt.publish(config.control.roll,JSON.stringify({position:97}))
  await delay(1000)
  mqtt.publish(config.control.roll,"open")
}

function roll_command(cmd){
  if(is_window_closed){
    mqtt.publish(config.control.roll,cmd)
  }else{
    //fake warning up then down
    roll_down_up().then()
  }
}

//------------------ main ------------------
logger.info('window blind roll service just started')
logger.info('test info')
logger.verbose('test verbose')
logger.debug('test debug')
logger.silly('test silly')
mqtt.start()

function roll_buttons(topic,msg){
  if(msg.hasOwnProperty("click")){
    if(["on","open","brightness_up"].includes(msg.click)){
      logger.info(`roll> ${topic}  '${msg.click}' => open`)
      roll_command("open")
    }else if(["off","close","brightness_down"].includes(msg.click)){
      logger.info(`roll> ${topic}  '${msg.click}' => close`)
      roll_command("close")
    }else if(["release","brightness_stop"].includes(msg.click)){
      logger.info(`roll> ${topic}  '${msg.click}' => stop`)
      roll_command("stop")
    }
  }
}

function roll_volume_move(topic,message){
  if(message.hasOwnProperty("brightness")){
    logger.verbose(`volume> ${topic} : ${message}`)
  }
}

function roll_volume_control(topic,msg){
  if(msg == "rotate_left"){
    target_position +=5
    //logger.verbose(`volume control> start`)
    control = true
  }else if(msg == "rotate_right"){
    target_position -=5
    //logger.verbose(`volume control> stop`)
    control = true
  }else if(msg == "rotate_stop"){
    logger.verbose(`requesting position> ${target_position}`)
    roll_command(JSON.stringify({position:target_position}))
    control = false
  }
}

function roll_position(topic,message){
  if(message.hasOwnProperty("position")){
    position = parseInt(message.position)
    logger.verbose(`position> ${position}`)
    if(!control){
      target_position = position
    }
  }
}

function window_state(topic,message){
  console.log(`updating window state closed = ${message.contact}`)
  if(is_window_closed != message.contact){
    is_window_closed = message.contact
  }
}

mqtt.Emitter.on('mqtt',(data)=>{
  if(data.topic == "mzig/roll button 1"){
    roll_buttons(data.topic,JSON.parse(data.msg))
  }else if(data.topic == "lzig/roll button 2"){
    roll_buttons(data.topic,JSON.parse(data.msg))
  }else if(data.topic == "lzig/bedroom roll"){
    //roll_position(data.topic,JSON.parse(data.msg))
  }else if(data.topic == "lzig/bedroom window"){
    window_state(data.topic,JSON.parse(data.msg))
  }
})

