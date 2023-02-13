#  deaddrop-js

A deaddrop utility written in Typescript. Put files in a database behind a password to be retrieved at a later date.

This is a part of the University of Wyoming's Secure Software Design Course (Spring 2023). This is the base repository to be forked and updated for various assignments. Alternative language versions are available in:
- [Go](https://github.com/andey-robins/deaddrop-go)
- [Rust](https://github.com/andey-robins/deaddrop-rs)

## Versioning

`deaddrop-js` is built with:
- node v18.13.0

## Usage

`npm run build && node dist/index.js --help` for instructions

Then run `node dist/index.js --new --user <username here>` and you will be prompted to create the initial password.

## Database

Data gets stored into the local database file dd.db. This file will not by synched to git repos. Delete this file if you don't set up a user properly on the first go


## Logging Strategy
<p align="justify">I used the log4js logging library for logging errors and infos of this application. All infos are logged to the log.txt file. I used the logLevelFilter function to filter all errors to log_errors.txt. This ensures that infos and errors aren't mixed up, which might make debugging difficult. Since the application is written to throw user-based errors like providing a wrong username while sending a message, providing an incorrect password, and the like, logging errors in the catch blocks and the respective blocks will cause duplication of errors logged. But since it is also imperative to catch unforeseen errors, it is proper to log all errors at the catch block, including the error message. 
I also added the context "READ," "SEND," and "NEW USER" to imply log is from reading a message, sending a message, or creating a new user, respectively. I created two appenders for each of the files and two categories as well.<p>


## Mitigation
<p align="justify">The modification I proposed in the security analysis was to encrypt the message in the database and decrypt them during reading. The concern, in this case, becomes how to securely store the security keys used in the encryption of the message. The best strategy would have been using public-private key encryption, where public keys will be saved in the DB for message encryption while users keep their private keys. The issue with this approach is that it will affect the system's usability since users will have to enter long keys to read messages. Since security is about trade-offs between security and usability, I chose symmetric key encryption for encrypting and decrypting the messages with the same keys. To keep the keys safe, I saved them in an environment file (.env file) instead of hardcoding. The concern becomes securing the code base and the security keys. Best security practices require not committing the .env file at all; however, I have also committed it for assessment's sake.
I used the crypto library for the encryption task. I modified the messages files in the db directory to encrypt the message before saving it in the DB and decrypting it when reading it. I also used the "aes-256-gcm" encryption algorithm.<p>