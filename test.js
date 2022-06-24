const mqtt = require('mqtt')
const client  = mqtt.connect('mqtt://192.168.0.22')

function make(name, sensor_name, unit, dev_cla) {
    const sensor = sensor_name.toLowerCase().replace(/ /g, '_')
    dev_cla = dev_cla || sensor
    let path = `homeassistant/sensor/ruuvi${name}/${sensor}`
    let topic = `${path}/config`

    const device = {
        "ids":`ruuvitag-${name}`,
        "mf":"Ruuvi Innovations Ltd",
        "mdl":"RuuviTag",
        "name":`RuuviTag ${name}`
    }
    let obj = {
        "stat_t": `${path}/state`,
        "json_attr_t": `${path}/attributes`,
        "name": `RuuviTag ${name} ${sensor_name}`,
        "unit_of_meas": unit,
        dev_cla,
        "uniq_id": `ruuvitag_${name}_${sensor}`,
        device,
    }
    client.publish(topic, JSON.stringify(obj))
    client.publish(`${path}/state`, '13.21')
    client.publish(`${path}/attributes`, JSON.stringify({"RuuviTag":name,"Measure":sensor_name,"Unit":unit}))
}

client.on('connect', function () {
    make('etupiha', 'Temperature', '°C')
    make('etupiha', 'Dew point', '°C', 'temperature')
    make('etupiha', 'Humidity', '%')
    make('etupiha', 'Pressure', 'hPa')
    client.end()
})

/*
  client.subscribe('presence', function (err) {
    if (!err) {
      client.publish('presence', 'Hello mqtt')
    }
  })
})

client.on('message', function (topic, message) {
  // message is Buffer
  console.log(message.toString())
  client.end()
})
*/