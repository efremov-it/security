1. install
https://github.com/gitleaks/gitleaks/releases

wget https://github.com/gitleaks/gitleaks/releases/download/v8.27.0/gitleaks_8.27.0_linux_x64.tar.gz
tar -xzvf gitleaks_8.27.0_linux_x64.tar.gz
sudo mv gitleaks /usr/local/bin/

2. use in directory

gitleaks detect -v

If you have found some secrets in your source code repository and you want to erase them, there are several tools that can help you. [BFG](https://rtyley.github.io/bfg-repo-cleaner/) repo cleaner is one of them. I will be soon writing a separate blog on how to use this tool…

3. prevent leaks

gitleaks protect
gitleaks protect -v
