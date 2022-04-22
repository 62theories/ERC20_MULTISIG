import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
import {
  MultiSigWallet,
  MultiSigWallet__factory,
  WisdomToken,
  WisdomToken__factory,
} from "../typechain";

describe("Wisdom", function () {
  it("owner can mint", async function () {
    const [owner, account1] = await ethers.getSigners();
    const Wisdom = (await ethers.getContractFactory(
      "WisdomToken"
    )) as WisdomToken__factory;
    const wisdom = (await Wisdom.deploy(
      "WISDOM",
      "WIS",
      await owner.getAddress()
    )) as WisdomToken;
    await wisdom.deployed();

    await wisdom.mint(
      await owner.getAddress(),
      ethers.utils.parseEther("50000000"),
      { from: await owner.getAddress() }
    );
  });

  it("not owner can not mint", async function () {
    const [owner, account1] = await ethers.getSigners();
    const Wisdom = (await ethers.getContractFactory(
      "WisdomToken"
    )) as WisdomToken__factory;
    const wisdom = (await Wisdom.deploy(
      "WISDOM",
      "WIS",
      await owner.getAddress()
    )) as WisdomToken;
    await wisdom.deployed();

    await expect(
      wisdom.mint(
        await owner.getAddress(),
        ethers.utils.parseEther("50000000"),
        { from: await account1.getAddress() }
      )
    ).to.be.reverted;
  });

  it("owner can not mint after grant to multisig", async function () {
    const [owner, account1] = await ethers.getSigners();
    const Wisdom = (await ethers.getContractFactory(
      "WisdomToken"
    )) as WisdomToken__factory;
    const wisdom = (await Wisdom.deploy(
      "WISDOM",
      "WIS",
      await owner.getAddress()
    )) as WisdomToken;
    await wisdom.deployed();
    const MultiSig = (await ethers.getContractFactory(
      "MultiSigWallet"
    )) as MultiSigWallet__factory;
    const multiSig = (await MultiSig.deploy(
      [await owner.getAddress(), await account1.getAddress()],
      2
    )) as MultiSigWallet;

    (
      await wisdom.changeOwner(multiSig.address, {
        from: await owner.getAddress(),
      })
    ).wait();
    await expect(
      wisdom.mint(
        await owner.getAddress(),
        ethers.utils.parseEther("50000000"),
        { from: await owner.getAddress() }
      )
    ).to.be.reverted;
  });

  it("can mint by both confirm and then execute to multisig", async function () {
    const [owner, account1] = await ethers.getSigners();
    const Wisdom = (await ethers.getContractFactory(
      "WisdomToken"
    )) as WisdomToken__factory;
    const wisdom = (await Wisdom.deploy(
      "WISDOM",
      "WIS",
      await owner.getAddress()
    )) as WisdomToken;
    await wisdom.deployed();
    const MultiSig = (await ethers.getContractFactory(
      "MultiSigWallet"
    )) as MultiSigWallet__factory;
    const multiSig = (await MultiSig.deploy(
      [await owner.getAddress(), await account1.getAddress()],
      2
    )) as MultiSigWallet;

    (
      await wisdom.changeOwner(multiSig.address, {
        from: await owner.getAddress(),
      })
    ).wait();

    const mintByte = new ethers.utils.Interface([
      "function mint(address to,uint256 amount)",
    ]).encodeFunctionData("mint", [
      await owner.getAddress(),
      ethers.utils.parseEther("50000000"),
    ]);
    wisdom.mint(await owner.getAddress(), ethers.utils.parseEther("50000000"));
    const tx1 = await multiSig.submitTransaction(wisdom.address, 0, mintByte, {
      from: await owner.getAddress(),
    });
    const txIdx = (await tx1.wait())?.events?.[0]?.args?.[1];
    await multiSig.confirmTransaction(ethers.BigNumber.from(txIdx));
    await multiSig
      .connect(account1)
      .confirmTransaction(ethers.BigNumber.from(txIdx));
    expect(await wisdom.balanceOf(owner.address)).to.equal(BigNumber.from(0));
    const tx3 = await multiSig.executeTransaction(ethers.BigNumber.from(txIdx));
    await tx3.wait();
    expect(await wisdom.balanceOf(owner.address)).to.equal(
      ethers.utils.parseEther("50000000")
    );
  });

  it("can not mint if not both confirm", async function () {
    const [owner, account1] = await ethers.getSigners();
    const Wisdom = (await ethers.getContractFactory(
      "WisdomToken"
    )) as WisdomToken__factory;
    const wisdom = (await Wisdom.deploy(
      "WISDOM",
      "WIS",
      await owner.getAddress()
    )) as WisdomToken;
    await wisdom.deployed();
    const MultiSig = (await ethers.getContractFactory(
      "MultiSigWallet"
    )) as MultiSigWallet__factory;
    const multiSig = (await MultiSig.deploy(
      [await owner.getAddress(), await account1.getAddress()],
      2
    )) as MultiSigWallet;

    (
      await wisdom.changeOwner(multiSig.address, {
        from: await owner.getAddress(),
      })
    ).wait();

    const mintByte = new ethers.utils.Interface([
      "function mint(address to,uint256 amount)",
    ]).encodeFunctionData("mint", [
      await owner.getAddress(),
      ethers.utils.parseEther("50000000"),
    ]);
    wisdom.mint(await owner.getAddress(), ethers.utils.parseEther("50000000"));
    const tx1 = await multiSig.submitTransaction(wisdom.address, 0, mintByte, {
      from: await owner.getAddress(),
    });
    const txIdx = (await tx1.wait())?.events?.[0]?.args?.[1];
    // await multiSig.confirmTransaction(ethers.BigNumber.from(txIdx));
    await multiSig
      .connect(account1)
      .confirmTransaction(ethers.BigNumber.from(txIdx));
    expect(await wisdom.balanceOf(owner.address)).to.equal(BigNumber.from(0));
    expect(multiSig.executeTransaction(ethers.BigNumber.from(txIdx))).to.be
      .reverted;
  });
});
