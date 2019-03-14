module.exports = ` 
const log = (label, data) => {
  try {
    var logData = JSON.parse(JSON.stringify(data));

    if(logData.body && logData.headers && logData.headers['Content-Type'] === 'application/json') logData.body = JSON.parse(logData.body);
    
    console.log(label + ": " + JSON.stringify(logData, null, 2))
  } catch (e) { }
};

const WrapFunction = fn => {
  return function handler(event, context, callback) {
    log("Function Init", event);

    fn(event, context, (err, resp) => {
      if (err) log("Error Response", err);
      if (resp) log("Success Response", resp);

      callback(err, resp);
    });
  };
};`
