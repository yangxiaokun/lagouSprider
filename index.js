/**
 * Created by yangxk on 2017/7/8.
 */
// 'use strict'
var request = require('superagent')
var cheerio = require('cheerio')
var mongo = require('./connectDB')
require('superagent-proxy')(request)
// import mongo from './connectDB'
//初始化数据库连接
let db
let connectDB = async function () {
  db = await mongo.db()
  if (db) {
    console.log('连接成功')
  }
}
let allIps = []
let getIPs = async function () {
  let res = await request.get('http://api.goubanjia.com/api/get.shtml?order=51fffb06c44985acaa9d9696ce791d3a&num=100&area=%E4%B8%AD%E5%9B%BD&port_ex=443&carrier=0&protocol=1&an1=1&an2=2&sp1=1&sp2=2&sp3=3&sort=1&system=1&distinct=0&rettype=0&seprator=%0D%0A').catch(err => {console.log(err)})
  let apiips = JSON.parse(res.text).data
  console.log(apiips.length)
  for (let o = 0; o < apiips.length; o++) {
    try {
      // let type = apiips[o].type || 'http'
      // let ip = type + '://' + apiips[o].ip + ':' + apiips[o].port
      // //代理IP请求，设置超时为3000ms，返回正确即当可用
      // let testip = await request.get('http://ip.chinaz.com/getip.aspx').proxy(ip).timeout(3000)
      // if (testip.statusCode == 200 && testip.text.substring(0, 4) == '{ip:') {
      //   //存入数据库
      //   console.log('可用Ip', ip)
      if (apiips[o].ip.indexOf('180.97.250') === -1 && apiips[o].ip.indexOf('223.83.130') === -1) {
        allIps.push(apiips[o])
        // }
      }
    } catch (error) {
    }
  }
  console.log('可用Ip共' + allIps.length)
}
let getPositionName = async function () {
  let res = await request.get('http://www.lagou.com')
  let $ = cheerio.load(res.text)
  let length = $('#sidebar .menu_box').length
  let positions, position = {}
  for (let num = 0; num < length; num++) {
    position.name = $($('.menu_main h2')[num]).text().replace(/\n/g, '').replace(/ /g, '')
    position.sub = []
    let menu_sub = ($($('.menu_sub')[num]).children('dl'))
    for (let subnum = 0; subnum < menu_sub.length; subnum++) {
      let subPosition = {}
      subPosition.name = $(menu_sub[subnum]).children('dt').children('a').text()
      subPosition.position = []
      positions = $(menu_sub[subnum]).children('dd').children('a')
      for (let positionnum = 0; positionnum < positions.length; positionnum++) {
        subPosition.position.push($(positions[positionnum]).text())
      }
      position.sub.push(subPosition)
    }
    await db.collection('positionName').insert({position: position})
    console.log('写入所有职位')
  }
}
let citys = ['上海']
let UAs = ['Mozilla/5.0 (Windows NT 6.1; WOW64; rv:23.0) Gecko/20130406 Firefox/23.0',
  'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:18.0) Gecko/20100101 Firefox/18.0',
  'Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US) AppleWebKit/533+ \(KHTML, like Gecko) Element Browser 5.0',
  'IBM WebExplorer /v0.94', 'Galaxy/1.0 [en] (Mac OS X 10.5.6; U; en)',
  'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)',
  'Opera/9.80 (Windows NT 6.0) Presto/2.12.388 Version/12.14',
  'Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) \Version/6.0 Mobile/10A5355d Safari/8536.25',
  'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) \Chrome/28.0.1468.0 Safari/537.36',
  'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.0; Trident/5.0; TheWorld)']

let allpositionNames
let tecPositions
let alltecPosition = []
let repeatPosition = []
let ipNo = 0
let getAllInfo = async function () {
  allpositionNames = await db.collection('positionName').find().toArray()
  allpositionNames.forEach((item) => {
    let arrays = item.position.sub
    let name = item.position.name
    arrays.forEach((item1) => {
      item1.position.forEach((item2,index) => {
        item1.position[index] = {
          position:item2,
          name:name
        }
      })
    })
    arrays.forEach((item3) =>{
      alltecPosition = alltecPosition.concat(item3.position)
    })
  })
  // tecPositions = allpositionNames[0].position.sub
  // tecPositions.forEach((item, index) => {
  //   // if (index < 5) {
  //     alltecPosition = alltecPosition.concat(item.position)
  //   // }
  //
  // })
}
function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
let sprider = async function (position, page, city) {
  let type = allIps[ipNo].type || 'http'
  let ip = type + '://' + allIps[ipNo].ip + ':' + allIps[ipNo].port
  let positionResult, jobsResult
  if (repeatPosition.indexOf(position) === -1) {
    try {
      let index = Math.floor(Math.random() * 10)
      await sleep(1000)
      // let res = await request.get('http://dynamic.goubanjia.com/dynamic/get/51fffb06c44985acaa9d9696ce791d3a.html?random=yes')
      // let ip = 'http://' + res.text.split('\n')[0]
      console.log('发起请求 ' + ' ' + city + position + ' ' + page, ip)
      let query = 'city=' + encodeURI(city) + '&positionName=' + encodeURI(position) + '&pageNo=' + page + '&pageSize=15'
      positionResult = await request.get('http://m.lagou.com/search.json')
        .query(query)
        .set('Accept', 'application/json')
        .set('Connection', 'keep-alive')
        .set('Referer', 'http://m.lagou.com/search.html')
        .set('User-Agent', UAs[index])
        .proxy(ip)
        .timeout(3000)
      positionResult.on('error', err => console.log(err))
    } catch (err) {
      ipNo++
      if (ipNo >= allIps.length) {
        ipNo = 0
      }
      console.log('request error, again')
      return await sprider(position, page, city)
    }
    if (page === 1) {
      await db.collection('total').insert({
        position: position,
        total: positionResult.body.content.data.page.totalCount,
        city: city
      })
    }
    if (positionResult.body.content.data.page.result.length === 0) {
      repeatPosition.push(position)
    } else {
      await setInDB(position, positionResult.body.content.data.page.result)
    }
  }
}
let getPositonJob = async function (i, city) {
  for (let page = 1; page < 31; page++) {
    await sprider(alltecPosition[i], page, city).catch(err => {console.log('sprider调用失败', err)})
  }
}
let getCityData = async function (city) {
  console.log(city)
  for (let i = 0; i < alltecPosition.length; i++) {
    // await sleep(5000+ Math.floor(Math.random() * 10000))
    try {
      await getPositonJob(i, city)
    } catch (err) {
      console.log(err)
      return await getPositonJob(i, city)
    }
  }
}
let startSprider = async function () {
  console.log(citys)
  for (let m = 0; m < citys.length; m++) {
    try {
      await getCityData(citys[m])
    } catch (err) {
      console.log(err)
      return await getCityData(citys[m])
    }
  }
}
let getNationTotal = async function (position) {
  sleep(1000)
  let index = Math.floor(Math.random() * 10)
  let query = 'city=' + encodeURI('全国') + '&positionName=' + encodeURI(position.position) + '&pageNo=1&pageSize=15'
  let positionResult = await request.get('http://m.lagou.com/search.json')
    .query(query)
    .set('Accept', 'application/json')
    .set('Connection', 'keep-alive')
    .set('Referer', 'http://m.lagou.com/search.html')
    .set('User-Agent', UAs[index])
    .timeout(3000)
  positionResult.on('error', err => console.log(err))
  console.log(position.position, positionResult.body.content.data.page.totalCount)
  await db.collection('total').insert({
    position: position.position,
    name: position.name,
    total: +positionResult.body.content.data.page.totalCount,
    city: '全国'
  })
}

function setInDB (position, results) {
  if (typeof results === 'string') {
    results = JSON.parse(results)
  }
  results.forEach(async (item) => {
    let salarysplit = item.salary.replace(/[k\u4e00-\u9fa5]/g, '').split('-')
    let salary = 0
    let salaryValue = 0
    if (salarysplit.length === 2) {
      salarysplit.forEach(function (item) {
        salary += parseInt(item)
      })
      salaryValue = salary / 2
    } else {
      salaryValue = parseInt(salarysplit[0])
    }
    delete item.companyLogo
    delete item.logger
    item.position = position
    item.pubtime = dateFormat(item.createTime)
    item.avgsalary = salaryValue
    await db.collection('alljobs').update({positionId:item.positionId}, item, {upsert:true})
  })
  console.log(position + ' 写入完成，共写入' + results.length + '条')
}
function dateFormat (time) {
  let now = new Date()
  let y = now.getFullYear()
  let m = (now.getMonth() + 1) < 10 ? '0' + (now.getMonth() + 1) : (now.getMonth() + 1)
  let td = now.getDate() < 10 ? '0' + now.getDate() : now.getDate()
  if (time.indexOf('今天') !== -1) {
    let timesplit = time.split(' ')[1]
    let timetd = y + '-' + m + '-' + td + ' ' + timesplit
    return new Date(timetd).getTime()
  } else if (time.indexOf('昨天') !== -1) {
    let yestimesplit = time.split(' ')[1]
    let yesterday = new Date(now.getTime() - (60 * 60 * 24))
    let yy = yesterday.getFullYear()
    let ym = (yesterday.getMonth() + 1) < 10 ? '0' + (yesterday.getMonth() + 1) : (yesterday.getMonth() + 1)
    let yd = yesterday.getDate() < 10 ? '0' + yesterday.getDate() : yesterday.getDate()
    let timeys = yy + '-' + ym + '-' + yd + ' ' + yestimesplit
    return new Date(timeys).getTime()
  } else {
    return new Date(time).getTime()
  }
}

connectDB()
  // .then(getIPs)
  .then(getAllInfo)
  .then(async function () {
    for(let i = 0;i<alltecPosition.length;i++) {
        await getNationTotal(alltecPosition[i])
    }
  })
  // .then(startSprider)
// .then(removeRepeat)

