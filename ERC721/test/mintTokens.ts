import { ChainEvent, Contract, Signer } from "./types.ts";

export async function mintTokens(
  contract: Contract,
  owner: Signer,
  count: number,
) {
  const transactions: Promise<unknown>[] = [];

  for (let index = 0n; index < count; index++) {
    const tx = await contract.connect(owner).mint({
      value: await contract.tokenPrice(),
    });

    transactions.push(tx.wait());
  }

  return transactions;
}
export async function mintTokensAndReturnTokenIdentifiers(
  contract: Contract,
  owner: Signer,
  count: number,
): Promise<number[]> {
  const ownerFilter = contract.filters.Transfer(null, owner);
  await mintTokens(contract, owner, count);
  const ownerEvents = await contract.queryFilter(ownerFilter);

  return ownerEvents.map((event: ChainEvent) => event.args[2]);
}
export async function mintTokensAndZipTxWithTokenIdentifiers(
  contract: Contract,
  owner: Signer,
  count: number,
) {
  const ownerFilter = contract.filters.Transfer(null, owner);
  const transactions = await mintTokens(contract, owner, count);
  const ownerEvents = await contract.queryFilter(ownerFilter);

  return ownerEvents.map((
    event: ChainEvent,
    index: number,
  ) => {
    return { tx: transactions[index], tokenId: event.args[2] };
  });
}
export async function mintOneToken(contract: Contract, owner: Signer) {
  return (await mintTokensAndReturnTokenIdentifiers(contract, owner, 1))[0];
}
