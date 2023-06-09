// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { promisify } from 'util';
import * as stream from "stream";
import Fs from 'fs';
import Path from 'path';
import Pino from 'pino'

const logger = Pino()

const pipeline = promisify(stream.pipeline);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { slug } = req.query
  if (slug !== 'andriod') {
    res.status(400);
    res.json({ msg: '下载链接不存在' })
  }

  logger.info(`../../../../ => ${Fs.readdirSync(Path.resolve(__dirname, '../../../../'))}`)

  logger.info(`/ => ${Fs.readdirSync("/")}`)

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename=worship.apk');

  const filePath = Path.join(process.env.PROTECTED_FILES_FOLDER || Path.resolve(__dirname, './assets'), 'v1.apk')

  await pipeline(
    Fs.createReadStream(filePath),
    res,
  );
}
