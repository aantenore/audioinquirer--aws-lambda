'use strict';
const puppeteer = require("puppeteer-extra");
const chrome = require("chrome-aws-lambda");
const userAgent = require('user-agents')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const header = {
  "Access-Control-Allow-Origin": "*", // Required for CORS support to work
}

const corsHeader = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,PUT",
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"
}

let resTemplate = {
  statusCode: 200,
  statusDescription: "200 OK",
  isBase64Encoded: false
};

module.exports.getBooks = async (event) => {
  let res = { ...resTemplate }
  if (event.httpMethod === 'OPTIONS') {
    res['headers'] = corsHeader
    console.log('OPTIONS')
  }
  else {
    try {
      var body = JSON.parse(event.body)
      var responseBody = await getBooksIn(body.url)
      log(body, responseBody)
      handleSuccess(res, responseBody)
    } catch (e) {
      handleError(res, e)
    }
  }
  return res
};

module.exports.getBookDetails = async (event) => {
  let res = { ...resTemplate }
  if (event.httpMethod === 'OPTIONS') {
    res['headers'] = corsHeader
    console.log('OPTIONS')
  }
  else {
    try {
      var body = JSON.parse(event.body)
      var responseBody = await getBookDetailsIn(body.url)
      log(body, responseBody)
      handleSuccess(res, responseBody)
    } catch (e) {
      handleError(res, e)
    }
  }
  return res
};

module.exports.getBookUrl = async (event) => {
  let res = { ...resTemplate }
  if (event.httpMethod === 'OPTIONS') {
    res['headers'] = corsHeader
    console.log('OPTIONS')
  }
  else {
    try {
      var body = JSON.parse(event.body)
      var responseBody = await getBookUrlIn(body.url)
      log(body, responseBody)
      handleSuccess(res, responseBody)
    } catch (e) {
      handleError(res, e)
    }
  }
  return res
};

var getBooksIn = async (url) => {
  let browser = await initBrowser()
  var page = await initPage(url, browser);
  var err = "No errors"
  var result = await page.evaluate(() => {
    try {
      var booksAndCompetitor = {
        books: []
      }
      var competitorsObj = document.querySelector('.resultsSummarySubheading')
      if (competitorsObj) {
        booksAndCompetitor['competitorsAU'] = competitorsObj.textContent
      }
      var bookItems = Array.from(document.querySelectorAll('.productListItem'))
      if (bookItems && bookItems.length > 0) {
        //bookItems = bookItems.slice(0, 3)
        bookItems.map(bookItem => {
          var book = {}
          var titleLinks = Array.from(bookItem.querySelectorAll('.bc-link'))
          if (titleLinks) {
            var index = titleLinks.length > 1 ? 1 : 0
            book['titleAU'] = titleLinks[index].textContent.replace(/(\r\n|\n|\r)/gm, "").replace(/ +(?= )/g, '')
            book['audibleUrlAU'] = titleLinks[index].href
          }
          var setField = (key, label, labelType) => {
            var parentObj = bookItem.querySelector(label)
            if (parentObj) {
              var childObj = parentObj.querySelector(labelType)
              if (childObj) {
                book[key] = childObj.textContent.replace(/(\r\n|\n|\r)/gm, "").replace(/ +(?= )/g, '')
              }
            }
          }
          setField('subTitleAU', '.subtitle', '.bc-text')
          setField('authorAU', '.authorLabel', '.bc-link')
          setField('narratorAU', '.narratorLabel', '.bc-link');
          setField('lengthAU', '.runtimeLabel', '.bc-text');
          setField('releaseDateAU', '.releaseDateLabel', '.bc-text');
          setField('reviewsAU', '.ratingsLabel', '.bc-size-small')
          booksAndCompetitor.books.push(book)
        })
      }
      return booksAndCompetitor
    } catch (e) {
      err = e
      throw e
    }
  }).catch(e => console.log('Error retrieving the books from audible, please retry \n', e))
  console.log(err)
  end(page)
  browser.close();
  return result
}

var getBookDetailsIn = async (urlObj) => {
  let totalResult = {}
  let browser = await initBrowser()
  let bookIds = Object.keys(urlObj)
  for (let i = 0; i < bookIds.length; i++) {
    let bookId = bookIds[i]
    let url = urlObj[bookId]
    var page = await initPage(url, browser);
    var err = "No errors"
    var result = await page.evaluate(() => {
      try {
        var bookDetails = {}
        var audibleProductDetails = document.querySelector('#audibleProductDetails')
        if (audibleProductDetails) {
          setField = (key, label) => {
            var parentObject = audibleProductDetails.querySelector(label)
            if (parentObject) {
              var childObj = parentObject.querySelector('td')
              if (childObj) {
                var obj = childObj.querySelector(':first-child')
                if (obj) {
                  bookDetails[key] = obj.textContent.replace(/(\r\n|\n|\r)/gm, "").replace(/ +(?= )/g, '')
                }
              }
            }
          }
          setField('lengthAM', '#detailsListeningLength')
          setField('authorAM', '#detailsauthor')
          setField('narratorAM', '#detailsnarrator')
          setField('whyspersyncForVoiceAM', '#detailsWhisperSyncForVoiceReady')
          setField('releaseDateAM', '#detailsReleaseDate')
          setField('publisherAM', '#detailspublisher')
          setField('programTypeAM', '#detailsProgramType')
          setField('versionAM', '#detailsVersion')
          setField('languageAM', '#detailsLanguage')
          setField('asinAM', '#detailsAsin')
          var bsrContainer = audibleProductDetails.querySelector('.prodDetSectionEntry+td')
          var bsrValues = Array.from(bsrContainer ? bsrContainer.querySelectorAll('span>span') : [])
          bookDetails['bsrAM'] = []
          bsrValues.map((bsrValue) => {
            bookDetails['bsrAM'].push(bsrValue.textContent.replace(/(\r\n|\n|\r)/gm, "").replace(/ +(?= )/g, ''))
          })
        }
        return bookDetails
      } catch (e) {
        err = e
        throw e
      }
    })
    totalResult[bookId] = result
    console.log(err)
    end(page);
  }
  browser.close();
  return totalResult;
}

var getBookUrlIn = async (urlObj) => {
  let totalResult = {}
  let browser = await initBrowser()
  let bookIds = Object.keys(urlObj)
  for (let i = 0; i < bookIds.length; i++) {
    let bookId = bookIds[i]
    let url = urlObj[bookId]
    console.log('[parser.getBookUrlIn] The search url is: ', url)
    var page = await initPage(url, browser);
    var err = "No errors"
    var result = await page.evaluate(() => {
      try {
        var itemsFound = Array.from(document.querySelectorAll('.s-result-item'))
        var tempBookUrl
        for (let index = 0; index < itemsFound.length; index++) {
          var itemFound = itemsFound[index]
          tempBookUrl = itemFound.querySelector('.a-link-normal.a-text-normal')
          let url = tempBookUrl ? tempBookUrl.href : 'No Url'
          if (url != 'No Url') {
            return url
          }
        }
        return 'No Url'
      } catch (e) {
        err = e
        throw e
      }
    })
    console.log(err)
    console.log('[parser.getBookUrlIn] The book url is: ', result)
    totalResult[bookId] = result;
    end(page);
  }
  browser.close();
  return totalResult
}

var end = async (page) => {
  page.close();
}

var initPage = async (url, browser) => {
  try {
    var page = await browser.newPage()
    var timeout = 25000
    await page.setRequestInterception(true);
    await page.removeAllListeners('request');
    page.on("request", async (req) => {
      try {
        switch (req.resourceType()) {
          case "image":
          case "stylesheet":
          case "font":
            return req.abort();
          default:
            return req.continue();
        }
      } catch (e) {
        console.log(e, 'Error in onRequest')
      }
    })
    await page.setUserAgent(userAgent.toString())
    await page.goto(url, { timeout: timeout})
    return page
  } catch (e) {
    console.log('Error opening the page', e)
    throw e
  }
}

var initBrowser = async () => {
  var config = {
    executablePath: await chrome.executablePath,
    defaultViewport: chrome.defaultViewport,
    headless: chrome.headless,
    ignoreHTTPSErrors: true,
    args: [...chrome.args]
  }
  if (process.env.IS_OFFLINE) {
    config['executablePath'] = require('chromium').path
  }
  let browser = await puppeteer.launch(config)
  return browser
}

var getHeader = (contentType) => {
  return { ...header, "Content-Type": contentType }
}

var handleSuccess = (res, responseBody, contentType = "application/json; charset=utf-8") => {
  res['headers'] = getHeader(contentType)
  res['body'] = JSON.stringify(responseBody)
}

var log = (body, responseBody) => {
  console.log("Request/Response\n---------------\nRequest body: ", JSON.stringify(body, null, 2), "\n---------------\nResponse body: ", JSON.stringify(responseBody, null, 2));
}

var handleError = (res, e) => {
  res['body'] = JSON.stringify(e);
  res['statusCode'] = 500;
  res['statusDescription'] = "500 Internal Server Error";
}