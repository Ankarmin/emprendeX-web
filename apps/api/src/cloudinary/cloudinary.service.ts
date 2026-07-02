import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  private readonly folder: string;

  constructor(private readonly configService: ConfigService) {
    this.folder = configService.get<string>(
      'CLOUDINARY_UPLOAD_FOLDER',
      'emprendex',
    );
  }

  async uploadImage(
    file: Express.Multer.File,
    publicId: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: this.folder,
          public_id: publicId,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              new InternalServerErrorException(
                'Error al subir imagen a Cloudinary',
              ),
            );
          }
          resolve(result.secure_url);
        },
      );

      const readableStream = new Readable();
      readableStream.push(file.buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(`${this.folder}/${publicId}`);
    } catch {
      // La imagen pudo ya no existir; no es crítico
    }
  }

  extractPublicId(secureUrl: string): string | null {
    try {
      const url = new URL(secureUrl);
      const pathParts = url.pathname.split('/');
      const filename = pathParts[pathParts.length - 1];
      return filename.split('.')[0];
    } catch {
      return null;
    }
  }
}
