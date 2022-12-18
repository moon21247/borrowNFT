import { useRef, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// @mui
import {
  Avatar,
  Box,
  Button,
  Divider,
  Hidden,
  lighten,
  List,
  ListItem,
  ListItemText,
  Popover,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ExpandMoreTwoToneIcon from '@mui/icons-material/ExpandMoreTwoTone';
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import LockOpenIcon from '@mui/icons-material/LockOpen';

// hooks
import { useWeb3React } from '@web3-react/core';
import { useForm } from 'react-hook-form';
import useToogle from 'src/hooks/useToogle';
import useAuth from 'src/hooks/useAuth';
import useSendFileToIPFS from 'src/hooks/useSendFileToIPFS';

// utils
import { shorter } from 'src/utils';
import { connectorLocalStorageKey, ConnectorNames } from 'src/utils/connectors';

// components
import Loader from 'src/components/Loader';

const UserBoxButton = styled(Box)(
  ({ theme }) => `
      padding: 0 ${theme.spacing(1)};
      display: flex;
      align-items: center;
      cursor: pointer;
`
);
const MenuUserBox = styled(Box)(
  ({ theme }) => `
        background: ${theme.colors.alpha.black[5]};
        padding: ${theme.spacing(2)};
`
);
const UserBoxText = styled(Box)(
  ({ theme }) => `
        text-align: left;
        padding-left: ${theme.spacing(1)};
`
);
const UserBoxLabel = styled(Typography)(
  ({ theme }) => `
        font-weight: ${theme.typography.fontWeightLight};
        color: ${theme.colors.alpha.white[100]};
        display: block;
`
);
const UserBoxDescription = styled(Typography)(
  ({ theme }) => `
        color: ${lighten(theme.palette.secondary.main, 0.5)}
`
);

interface ImageUrlProps {
  realUrl: string;
  virtualUrl: string;
}
interface UserInfoProps {
  nickName: string;
  bio: string;
}
const initialState: UserInfoProps = {
  nickName: '',
  bio: ''
};

function HeaderUserbox() {
  const { account } = useWeb3React();
  const { loginWallet, logoutWallet } = useAuth();
  const { open, handleOpen, handleClose } = useToogle();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('none');
  const [userInfo, setUserInfo] = useState<UserInfoProps>({
    ...initialState
  });
  const [imgUrl, setImgUrl] = useState<ImageUrlProps>({
    realUrl: '',
    virtualUrl: ''
  });
  const [isOpen, setOpen] = useState<boolean>(false);
  const refBox = useRef<any>(null);
  const fileRef = useRef<any>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<UserInfoProps>();

  const profileOpen = (): void => {
    if (account) setOpen(true);
  };
  const profileClose = (): void => {
    setOpen(false);
  };
  function connectWallet() {
    loginWallet(ConnectorNames.Injected);
    window.localStorage.setItem(
      connectorLocalStorageKey,
      ConnectorNames.Injected
    );
    profileClose();
  }
  function disconnectWallet() {
    logoutWallet();
    window.localStorage.removeItem(connectorLocalStorageKey);
    profileClose();
  }
  function createProfile() {
    profileClose();
    handleOpen();
  }
  function triggerPreviewImage() {
    fileRef.current?.click();
  }
  function previewImage(evt: any) {
    evt.persist();
    const file = evt.target.files[0];
    if (file)
      setImgUrl({
        realUrl: file,
        virtualUrl: window.URL.createObjectURL(file)
      });
  }
  function onUserInfoChange(e: { target: { name: any; value: any } }) {
    const { name, value } = e.target;
    setUserInfo({
      ...userInfo,
      [name]: value
    });
  }
  async function onSubmit(data: UserInfoProps) {
    setSaveStatus('start');
    if (!account) {
      toast.error('Connect your wallet');
      return;
    }

    if (!imgUrl.realUrl) return;

    setIsLoading(true);
    try {
      // Upload image to IPFS (pinata)
      const formData = new FormData();
      formData.append('file', imgUrl.realUrl);
      const resFile = await useSendFileToIPFS(formData);
      console.log(resFile.data.IpfsHash);

      navigate(`/account/profile/${account}`);
      setSaveStatus('success');
      setIsLoading(false);
    } catch (err) {
      console.error('Error while saving user info: ', err);
      setIsLoading(false);
    } finally {
      handleClose();
    }
  }
  function onReset() {
    reset();
    setImgUrl({ realUrl: '', virtualUrl: '' });
  }

  return (
    <>
      <UserBoxButton color="secondary" ref={refBox} onClick={profileOpen}>
        <Button
          size="small"
          variant="contained"
          color="primary"
          className="connectWallet"
          onClick={connectWallet}
        >
          {account ? shorter(account) : 'Connect Wallet'}
        </Button>
      </UserBoxButton>
    </>
  );
}

export default HeaderUserbox;