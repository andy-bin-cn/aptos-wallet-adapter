import Button from 'components/Button';
import { useFormikContext } from 'formik';
import { useCallback, useEffect, useState } from 'react';
import { SwapIcon } from 'resources/icons';
import { ISwapSettings } from '../types';
import CurrencyInput from './CurrencyInput';
import SwapDetail from './SwapDetail';
import useHippoClient from 'hooks/useHippoClient';
import useAptosWallet from 'hooks/useAptosWallet';

const TokenSwap = () => {
  const { values, setFieldValue, resetForm } = useFormikContext<ISwapSettings>();
  const [isSwapping, setIsSwapping] = useState(false);
  const { activeWallet, openModal } = useAptosWallet();
  const hippoClient = useHippoClient();
  const fromSymbol = values.currencyFrom?.token.symbol;
  const toSymbol = values.currencyTo?.token.symbol;
  const fromUiAmt = values.currencyFrom?.amount;
  const hippoWallet = hippoClient.hippoWallet;

  const fetchSwapPrice = useCallback(() => {
    if (hippoClient.hippoSwap && fromSymbol && toSymbol && fromUiAmt) {
      const quote = hippoClient.hippoSwap.getBestQuoteBySymbols(fromSymbol, toSymbol, fromUiAmt, 3);
      if (quote) {
        // TO UPDATE: IMPLEMENT FETCH BEST PRICE
        setFieldValue('currencyTo', {
          ...values.currencyTo,
          amount: quote.bestQuote.outputUiAmt
        });
      }
    }
  }, [values, setFieldValue]);

  useEffect(() => {
    fetchSwapPrice();
  }, [values.currencyFrom?.amount, values.currencyFrom?.token, values.currencyTo?.token]);

  const onClickSwapToken = useCallback(() => {
    const tokenFrom = values.currencyFrom;
    const tokenTo = values.currencyTo;
    setFieldValue('currencyFrom', tokenTo);
    setFieldValue('currencyTo', tokenFrom);
  }, [values, setFieldValue]);

  const onClickSwap = useCallback(async () => {
    setIsSwapping(true);
    if (hippoClient.hippoSwap && hippoWallet && fromSymbol && toSymbol && fromUiAmt) {
      const quote = hippoClient.hippoSwap.getBestQuoteBySymbols(fromSymbol, toSymbol, fromUiAmt, 3);
      if (quote) {
        const minOut = quote.bestQuote.outputUiAmt * (1 - values.slipTolerance / 100);
        await hippoClient.requestSwap(fromSymbol, toSymbol, fromUiAmt, minOut, () => {
          resetForm();
        });
        // await hippoWallet.refreshStores();
        // TODO: refresh the UI numbers
        // setRefresh(true);
      } else {
        // TODO: info bubble "route note available"
      }
    }
    setIsSwapping(false);
  }, [fromSymbol, toSymbol, fromUiAmt, hippoClient, hippoWallet, values.slipTolerance, resetForm]);

  return (
    <div className="w-full flex flex-col px-8 gap-1">
      <CurrencyInput actionType="currencyFrom" />
      <Button variant="outlined" className="!bg-secondary !border-0" onClick={onClickSwapToken}>
        <SwapIcon />
      </Button>
      <CurrencyInput actionType="currencyTo" />
      {!!values.currencyFrom?.amount && !!values.currencyTo?.token.symbol && <SwapDetail />}
      <Button
        isLoading={isSwapping}
        className="paragraph bold mt-14"
        onClick={!activeWallet ? openModal : onClickSwap}>
        {!activeWallet ? 'Connect to Wallet' : 'SWAP'}
      </Button>
    </div>
  );
};

export default TokenSwap;
