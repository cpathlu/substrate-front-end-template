import React, { useEffect, useState } from 'react';
import { Form, Grid } from 'semantic-ui-react';

import { useSubstrate } from './substrate-lib';
import { TxButton } from './substrate-lib/components';

import KittyCards from './KittyCards';

// const convertToKittyHash = entry =>
//   `0x${entry[0].toJSON().slice(-64)}`;

const convertToKittyIndex = entry =>
  entry[0].args.map((k) => k.toHuman())

const constructKitty = (hash, { dna, price, gender, owner }) => ({
  id: hash,
  dna,
  price: price.toJSON(),
  gender: gender.toJSON(),
  owner: owner.toJSON()
});

export default function Kitties (props) {
  const { api, keyring } = useSubstrate();
  const { accountPair } = props;

  const [kittyIndexs, setKittyIndexs] = useState([]);
  const [kitties, setKitties] = useState([]);
  const [status, setStatus] = useState('');

  const subscribeKittyCnt = () => {
    let unsub = null;

    const asyncFetch = async () => {
      unsub = await api.query.substrateKitties.kittyCnt(async cnt => {
        // Fetch all kitty keys
        const entries = await api.query.substrateKitties.kitties.entries();
        const indexs = entries.map(convertToKittyIndex);
        setKittyIndexs(indexs);
      });
    };

    asyncFetch();

    return () => {
      unsub && unsub();
    };
  };

  const subscribeKitties = () => {
    let unsub = null;

    const asyncFetch = async () => {
      unsub = await api.query.substrateKitties.kitties.multi(kittyIndexs, kitties => {
        const kittyArr = kitties
          .map((kitty, ind) => constructKitty(kittyIndexs[ind], kitty.value));
        setKitties(kittyArr);
      });
    };

    asyncFetch();

    // return the unsubscription cleanup function
    return () => {
      unsub && unsub();
    };
  };

  useEffect(subscribeKitties, [api, kittyIndexs]);
  useEffect(subscribeKittyCnt, [api, keyring]);

  return <Grid.Column width={16}>
  <h1>Kitties</h1>
  <KittyCards kitties={kitties} accountPair={accountPair} setStatus={setStatus}/>
  <Form style={{ margin: '1em 0' }}>
      <Form.Field style={{ textAlign: 'center' }}>
        <TxButton
          accountPair={accountPair} label='Create Kitty' type='SIGNED-TX' setStatus={setStatus}
          attrs={{
            palletRpc: 'substrateKitties',
            callable: 'createKitty',
            inputParams: [],
            paramFields: []
          }}
        />
      </Form.Field>
    </Form>
    <div style={{ overflowWrap: 'break-word' }}>{status}</div>
  </Grid.Column>;
}
