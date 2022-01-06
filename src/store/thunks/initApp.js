import { thunk } from 'easy-peasy';
import ky from 'ky';
import { api } from '../../config/api';
import { pages } from '../../config/pages';
import { store } from '../index';

export const initApp = thunk(async (actions) => {
  await store.persist.resolveRehydration();
  //const { claimPublicKey, claimSecretKey } = store.getState();
  const { claimPublicKey } = store.getState();

  try {
    const campaignStatus = await ky
      .get(api.campaignStatus, { searchParams: { event: process.env.REACT_APP_EVENT } })
      .json();

    if (!campaignStatus.isActive) return actions.toPage({ page: pages.campaignOver });
    // If there is no key in Local Storage that's means it is a first launch or email wasn't confirmed
    if (!claimPublicKey) return;

    const keyStatus = await ky
      .get(api.keyStatus, {
        searchParams: { publicKey: claimPublicKey, event: process.env.REACT_APP_EVENT },
      })
      .json();

    if(claimPublicKey && !keyStatus.isActive){
      actions.showMessage({message: 'All set, you will soon receive an e-mail with a gift.'});
      return;
    }
    if (keyStatus.isActive) {
       // goToWalletClaimPage(claimSecretKey);/* TODO: Temporarily blocked*/
      } else {
        actions.toPage({ page: pages.alreadyClaimed });
      }
  } catch (e) {
    actions.showError({ target: 'app', message: 'Fail to load application. Please try later' });
  } finally {
    actions.disableLoading({ target: 'app' });
  }
});
