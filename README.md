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

## MAC Strategy

### Database Modification
<p align="justify">
    The database was modified to accommodate the new changes to our system. Two fields were added to the Messages table, sender and mac fields. They are the mac field which stores the mac generated for each message, and the sender, to hold the message's sender.  

    A Before Updated Trigger was created to make the mac field uneditable and read-only to check if the updated value is different from the original value. It raises an error and aborts the operation. The error message is intended to be logged to a file; however, this feature has yet to be implemented because it requires writing an error logging callback function with the C programming language I am unfamiliar with. 
</p>

### Mac and Sender Authentication Implementation 

#### sender Authentication
<p>
To verify senders before sending a message, the index file was modified to include a "from" verb in the options, which takes a username as an argument. The username is validated as well.  

In the send file, the sender is then checked if it exists, followed by checking with the authenticate function to authenticate the user. **Note** When the authenticate function was called first before getting the message from the user, it always reverted to entering the password even though the message was gotten at the end. To avoid this bug, the get user message function is called first to get the message before authenticating the user. This was the best solution I could come up with.
</p>

#### Sending Message
The save same message function was modified to incorporate the changes in the message file. The query was modified to include the sender and the mac field. The sender id was retrieved with a sub-query and inserted as a value in the sender field. The mac was generated with a newly created function called generateMac which takes the recipient name as the key and then the sender and the data as the message to create the mac for. This will ensure that if the sender is modified, then the integrity of the message will not be verified.  

Using the username as the key makes it public knowledge; however, since the mac cannot be modified, it is assumed that a malign user cannot alter the message and generate a new corresponding mac. It also ensures that if the recipient is altered, the new recipient will be unable to read the message since it will fail the integrity test.  
  
Senders of messages that are not verified are pushed into an array of unverified messages, which are then displayed to the user to inform the user of messages from authors that could not be verified.

#### Reading Messages
<p>
The get Message for user function was modified as well. The query was modified to include the sender and the mac function. The query contained a subquery that fetches the sender name using the sender id. The read message, the sender, and the recipient are used to generate the mac for the read message and then compared to see if they are equal.  

Since I implemented an encrypting of the messages in the previous work, to change the Message, the ciphertext should be modified. This might raise a bad decrypting error which is handled to return an empty string and log to the error file so that the integrity of the Message cannot be verified. 
</p>

