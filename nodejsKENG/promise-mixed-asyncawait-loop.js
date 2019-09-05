/**
 * This is from Victor's retry logic. The loop will never be excuted because:
 * 1. while does not wait for inner logic, especially with promise. For loop will wait but only with async await.
 * 2. loop is returned on the first run. Although it's returning a promise.
 * 3. throw will raise unhandled error because try catch does not wait for promise.
 */
let retries = 0
let maxRetries = 1000

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}
const funct = async () => {
  while (retries < maxRetries) {
    console.log(retries)
    try {
      return new Promise((resolve, reject) => {
        console.log('retries', retries)
        throw new Error('p')
      })
        .then(() => {
          return sleep(Math.random() * 100)
        })
        .catch((e) => {
          console.log('error in prom', e)
          throw e
        })
    } catch (e) {
      retries++
      console.log('error-------', e)
    }
  }
  console.log('out of loop')
}

funct()

//---- original func
// const getDataServiceCheck = async (bac, vin) => {
//   let retries = 0
//   const maxRetries = 3
//   const url = CTP_API_URL + '/vehicles/admin' + '/dataservice/' + bac + '/' + vin

//   const apiKey = CTP_VEHICLE_API_KEY
//   while (retries < maxRetries) {
//     try {
//       return http.getApi(url, apiKey)
//         .then((result) => {
//           retries = maxRetries
//           if (result.statusCode === 200) {
//             return result.body
//           } else {
//             throw FAILED_TO_GET_STATUS
//           }
//         })
//     } catch (error) {
//       if (NETWORK_ERRORS.indexOf(error.code) > -1) {
//         retries++
//       } else {
//         retries = maxRetries
//         throw error
//       }
//     }
//   }
// }
