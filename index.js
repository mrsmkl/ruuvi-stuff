const bodyParser = require('body-parser')
const express = require('express')

const mqtt = require('mqtt')
const client  = mqtt.connect('mqtt://192.168.0.22')

const application = {
    port: process.env.PORT || 3030,
    host: process.env.HOST || '0.0.0.0',
  }

const app = express()

function dewPoint(Tc, R) {
    if (Tc < 0 || Tc > 60) {
        return Tc;
    }

    if (R < 0.01 || R > 1) {
        return Tc;
    }

    var a = 17.27;
    var b = 237.7;

    var alphaTR = ((a * Tc) / (b + Tc)) + Math.log(R);

    var Tr = (b * alphaTR) / (a - alphaTR);

    if (Tr < 0 || Tr > 50) {
        return Tc;
    }

    return Tr;
}

function make(name, sensor_name, unit, res, dev_cla) {
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
    client.publish(`${path}/state`, res)
    client.publish(`${path}/attributes`, JSON.stringify({"RuuviTag":name,"Measure":sensor_name,"Unit":unit}))
}

app.use(bodyParser.json())

app.post('/api/station', async function (req, res) {
  console.log('Received Ruuvi Station gateway API payload request')
  const measurement = req.body
  console.log(measurement)
  for (let tag of measurement.tags) {
    dewPoint(tag)
    let name
    if (tag.name === 'Ruuvi BE1E') {
        name = 'etupiha'
    } else if (tag.name === 'Ruuvi 3170') {
        name = 'jkaappi'
    }
    make(name, 'Temperature', '°C', tag.temperature.toFixed(2))
    make(name, 'Dew point', '°C', dewPoint(tag.temperature, tag.humidity/100).toFixed(2), 'temperature')
    make(name, 'Humidity', '%', tag.humidity.toString())
    make(name, 'Pressure', 'hPa', (tag.pressure / 100).toFixed(2))
  }
  res.json({ 'eventId': measurement.eventId })
})

app.get('/api/health', async function (req, res) {
    console.log('Received Ruuvi Station gateway API health check request')
    res.json({ 'status': 'OK' })
  })

client.on('connect', function () {
    app.listen(application.port, application.host)
    console.log(`Application listening for address ${application.host}:${application.port}`)
})
