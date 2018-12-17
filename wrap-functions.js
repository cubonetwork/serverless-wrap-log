module.exports = ` 
const log = (label, data) => {
    var logData = JSON.parse(JSON.stringify(data));

    if(logData.body) logData.body = JSON.parse(logData.body);

    console.log(label + ": " + JSON.stringify(logData, null, 2))
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
