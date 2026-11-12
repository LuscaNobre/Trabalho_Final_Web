// Fotos locais (client/public/images) usadas quando o barbeiro não tem avatarUrl cadastrado.
const localPhotos = {
  nox: { photo: '/images/barbeiro-nox.webp', avatar: '/images/barbeiro-nox-avatar.webp' },
  kruz: { photo: '/images/barbeiro-kruz.webp', avatar: '/images/barbeiro-kruz-avatar.webp' },
  luan: { photo: '/images/barbeiro-luan.webp', avatar: '/images/barbeiro-luan-avatar.webp' }
};

const keyFor = (barber) => String(barber?.name || '').trim().toLowerCase();

export function barberPhoto(barber) {
  return barber?.avatarUrl || localPhotos[keyFor(barber)]?.photo || '';
}

export function barberAvatar(barber) {
  return barber?.avatarUrl || localPhotos[keyFor(barber)]?.avatar || '';
}
