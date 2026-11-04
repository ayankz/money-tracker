// import { Injectable, OnModuleInit } from '@nestjs/common';
// import { Client } from 'minio';

// @Injectable()
// export class MinioService implements OnModuleInit {
//   private readonly minioClient: Client;
//   constructor() {
//     const options: any = {
//       endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
//       port: Number(process.env.MINIO_PORT ?? 9000),
//       useSSL: process.env.MINIO_USE_SSL === 'true',
//       accessKey: process.env.MINIO_ACCESS_KEY ?? 'admin',
//       secretKey: process.env.MINIO_SECRET_KEY ?? 'password123',
//     };

//     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
//     this.minioClient = new Client(options);
//   }
//   async onModuleInit() {
//     await this.initBucket();
//   }

//   private async initBucket() {
//     const bucketExists = await this.minioClient.bucketExists('statements');
//     if (!bucketExists) {
//       await this.minioClient.makeBucket('statements', 'us-east-1');
//     }
//   }
//   async uploadStatement(
//     fileBuffer: Buffer,
//     fileName: string,
//     contentType: string,
//   ) {
//     await this.minioClient.putObject(
//       'statements', // bucket
//       fileName, // object name
//       fileBuffer, // data
//       fileBuffer.length, // size (number)
//       { 'Content-Type': contentType }, // metadata
//     );
//     return fileName;
//   }
//   async getFileUrl(fileName: string) {
//     return this.minioClient.presignedGetObject('statements', fileName);
//   }
// }
