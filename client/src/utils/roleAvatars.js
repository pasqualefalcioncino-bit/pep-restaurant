import adminAvatar from '../assets/images/roles/admin.png';
import cameriereAvatar from '../assets/images/roles/cameriere.png';
import clienteAvatar from '../assets/images/roles/cliente.png';
import cuocoAvatar from '../assets/images/roles/cuoco.png';

const roleAvatars = {
  admin: adminAvatar,
  cameriere: cameriereAvatar,
  cliente: clienteAvatar,
  cuoco: cuocoAvatar,
};

export const getRoleAvatar = (role) => roleAvatars[role] || '';
