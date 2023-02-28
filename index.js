import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const text = fs.readFileSync(path.join(__dirname, 'input.txt'), 'utf8').replace(/\n/g, ' ').replace(/ {2,}/g, ' ');

const url = 'https://texttospeech.googleapis.com/v1beta1/text:synthesize';

const checkFileSize = async () => {
  try {
    const filePath = path.join(__dirname, 'input.txt');
    const stats = await fs.promises.stat(filePath);
    const fileSizeInBytes = stats.size;
    if (fileSizeInBytes > 5000) {
      const bytesExceeded = fileSizeInBytes - 5000;
      console.log(`The file exceeds 5000 bytes by ${bytesExceeded} bytes`);
      return false;
    } else {
      return true;
    }
  } catch (err) {
    console.error(err);
    return false;
  }
}

const requestOptions = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Goog-Api-Key': ''
  }
};

const requestBody = JSON.stringify({
  input: { text },
  voice: {
    languageCode: 'es-US',
    name: 'es-US-Standard-B',
    ssmlGender: 'MALE'
  },
  audioConfig: {
    audioEncoding: 'LINEAR16',
    effectsProfileId: ['small-bluetooth-speaker-class-device'],
    pitch: 0,
    speakingRate: 1
  }
});

const formatTitle = () => {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  return formattedDate.replace(/[\/:,-]\s*/g, '-');
}

const handleResponse = async (res) => {
  let responseData = '';
  for await (const chunk of res) {
    responseData += chunk;
  }
  if (res.statusCode === 200) {
    const { audioContent } = JSON.parse(responseData);
    const outputFile = `${formatTitle()}.wav`;
    await fs.promises.writeFile(outputFile, audioContent, 'base64');
    console.log(`The audio file '${outputFile}' has been created.`);
  } else {
    throw new Error(responseData);
  }
};

async function convertTextToSpeech() {
  try {
    const isFileSizeOk = await checkFileSize('input.txt');
    if (!isFileSizeOk) return;
    const req = https.request(url, requestOptions, handleResponse);
    req.on('error', (error) => { throw error });
    req.write(requestBody);
    req.end();
  } catch (error) {
    console.error('Error in the text-to-speech request:', error);
  }
};

convertTextToSpeech();
