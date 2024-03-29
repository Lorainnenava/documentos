import { Injectable } from '@nestjs/common';
import { Helper } from '../../../helper/adapter';

@Injectable()
export class DocumentUploadServiceMassive {
  constructor(private readonly _helper: Helper) {}

  async upload(files: {
    body: { buffer: Buffer | ArrayBuffer; originalname: string }[];
    key: string;
  }): Promise<string[]> {
    const documents: string[] = [];

    const reducedData = files.body.map((current, index) => {
      const uniqueKey = `${files.key}/${index}/${current.originalname}`;
      return {
        buffer: current.buffer,
        key: uniqueKey,
      };
    });

    for (const file of reducedData) {
      const path: string[] = file.key.split('/');
      let currentPath: string = '';

      try {
        // Verifica si la carpeta existe; de lo contrario, la crea
        await this._helper.folderOrSubFolderExist(`${path[0]}/`);

        // Verificar si la primera subCarpeta existe dentro de la carpeta raíz; de lo contrario, crearla
        if (path.length > 1) {
          currentPath = `${path[0]}/${path[1]}/`;
          await this._helper.folderOrSubFolderExist(currentPath);
        }

        // Crear las subCarpetas una por una
        for (let i = 2; i < path.length - 1; i++) {
          currentPath += `${path[i]}/`;
          await this._helper.folderOrSubFolderExist(currentPath);
        }

        // Crea el archivo
        const createFile = await this._helper.ownCloudAdapter(
          'PUT',
          file.key,
          file.buffer,
        );

        if (createFile.status === 201) {
          documents.push(`Archivo ${file.key} guardado exitosamente`);
        }
      } catch (error) {
        throw error;
      }
    }

    return documents;
  }
}
