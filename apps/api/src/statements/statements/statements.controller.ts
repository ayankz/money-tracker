// import {
//   Controller,
//   Post,
//   UploadedFile,
//   UseInterceptors,
// } from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { Express } from 'express';

// @Controller('statements')
// export class StatementsController {
//   constructor(private readonly minioService: MinioService) {}

//   @Post('upload')
//   @UseInterceptors(FileInterceptor('file'))
//   async uploadStatement(@UploadedFile() file: Express.Multer.File) {
//     if (!file) {
//       throw new Error('Файл не передан');
//     }

//     const fileName = await this.minioService.uploadStatement(
//       file.buffer,
//       file.originalname,
//       file.mimetype,
//     );
//     console.log('File uploaded:', fileName);

//     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
//     const fileUrl = await this.minioService.getFileUrl(fileName);

//     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
//     return { fileName, fileUrl };
//   }
// }
