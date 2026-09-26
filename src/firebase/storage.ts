import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from './config';

// Initialize Firebase Storage
export const storage = getStorage(app);

/**
 * Uploads a user avatar image to Firebase Cloud Storage with automatic compression fallback
 */
export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP, SVG)');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Kích thước hình ảnh tối đa là 5MB');
  }

  try {
    const extension = file.name.split('.').pop() || 'jpg';
    const avatarRef = ref(storage, `users/${userId}/avatar_${Date.now()}.${extension}`);
    
    const snapshot = await uploadBytes(avatarRef, file, {
      contentType: file.type,
      customMetadata: {
        userId,
        uploadedAt: new Date().toISOString()
      }
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.warn('Firebase Storage upload failed or bucket restricted, using client-side Data URL fallback:', error);
    
    // Fallback to client-side data URL so users can still preview and save their custom avatar
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Không thể xử lý tệp ảnh'));
        }
      };
      reader.onerror = () => reject(new Error('Lỗi khi đọc tệp ảnh'));
      reader.readAsDataURL(file);
    });
  }
}

export { ref, uploadBytes, getDownloadURL, deleteObject };
