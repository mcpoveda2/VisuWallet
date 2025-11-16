import React from 'react';
import { BottomBar } from 'components/BottomBar';
import Perfil from '../views/Application/Perfil';

// export type MainTabsParamList = {
//   Home: undefined;
//   Dashboard: undefined;
//   Statistics: undefined;
//   Perfil: undefined;
//   Settings: undefined;
// };

export default function MainNavigator() {
  const tabs = [
    // { name: 'Dashboard', component: Dashboard },
    // { name: 'Planning', component: Planning },
    // { name: 'Statistics', component: Statistics },
    { name: 'Perfil', component: Perfil, icon: 'person-circle-outline' },
  ];
  return <BottomBar tabs={tabs} />;
}
