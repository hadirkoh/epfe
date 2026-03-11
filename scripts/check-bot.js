const token = '8791506330:AAF5BhOhS3wHcVmmIEX9oXlup9g0mVOfYQk';
fetch(`https://api.telegram.org/bot${token}/getMe`)
    .then(res => res.json())
    .then(data => console.log(JSON.stringify(data, null, 2)))
    .catch(err => console.error(err));
