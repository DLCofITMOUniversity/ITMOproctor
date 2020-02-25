# ITMOproctor

Система дистанционного надзора ITMOproctor предназначена для сопровождения процесса территориально удаленного прохождения экзаменов, подтверждения личности испытуемого и подтверждения результатов его аттестации.

Система поддерживает интеграцию на уровне API со следующими LMS:

* [Национальная платформа открытого образования](https://openedu.ru)
* [Система управления обучением Университета ИТМО](https://de.ifmo.ru)

### Клиентская часть

Системные требования:

| Параметр                     | Минимальные требования             |
|------------------------------|------------------------------------|
| Операционная система         | Windows 7+; OS X 10.10+ x64; Linux |
| Процессор                    | Intel i3 1.2 ГГц или эквивалент    |
| Скорость сетевого соединения | 1 Мбит/c                           |
| Свободное место на диске     | 500 МБ                             |
| Свободная оперативная память | 1 ГБ                               |
| Разрешение веб-камеры        | 640x480                            |
| Частота кадров веб-камеры    | 15 кадров/с                        |
| Разрешение экрана монитора   | 1280x720                           |

Инструкции:

* [Инструкция по использованию системы для студентов](https://docs.google.com/document/d/15fsEL3sHCGuJ9_rSuFprQXP--WXb9Ct-PzayBXvxWp0/edit?usp=sharing)
* [Инструкция по использованию системы для инспекторов](https://docs.google.com/document/d/1EbW52RQLdgwkRwJa_HgzP-nqU_860bPQuMZZ-ns1Hmc/edit?usp=sharing)

### Серверная часть

* [Debian GNU/Linux](https://www.debian.org) или [Ubuntu](https://ubuntu.com)
* [Node.js](https://nodejs.org) и [NW.js](https://nwjs.io)
* [MongoDB](https://www.mongodb.com)
* [Kurento Media Server](https://www.kurento.org)

Системные требования:

| Параметр                      | Минимальные требования                           |
|-------------------------------|--------------------------------------------------|
| Операционная система          | Ubuntu 14.04 (64 бита)                           |
| Процессор                     | AMD Six-Core Opteron 2427 2.2 ГГц или эквивалент |
| Средняя нагрузка на процессор | 5% / сессия                                      |
| Оперативная память            | 2 ГБ + 100 МБ / сессия                           |
| Сетевое соединение            | 1.5 Мбит/c / сессия                              |
| Запись на диск                | 150 КБ/c / сессия                                |
| Дисковое пространство         | 500 МБ/час / сессия                              |
| Архивирование                 | 100 МБ/час / сессия                              |

Документация:

* [Структурная схема системы](https://drive.google.com/file/d/0B7YdZbqVWxzeSlFWZUl4S1RiaVE/view?usp=sharing)
* [Диаграмма взаимодействия компонентов системы](https://drive.google.com/file/d/0B7YdZbqVWxzeRVVBanVFWlVNQ2M/view?usp=sharing)

#### Развертывание системы на Ubuntu 14.04

Установить MongoDB:
```
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6
echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-3.4.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

Установить Node.js:
```
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Установить Kurento Media Server:
```
echo "deb http://ubuntu.kurento.org trusty kms6" | sudo tee /etc/apt/sources.list.d/kurento.list
wget http://ubuntu.kurento.org/kurento.gpg.key -O - | sudo apt-key add -
sudo apt-get update
sudo apt-get install kurento-media-server-6.0
```

Клонирование репозитория ITMOproctor и инициализация:
```
git clone https://github.com/openeduITMO/ITMOproctor.git
cd ./ITMOproctor
mv config-example.json config.json
npm install
```

Запуск сервера, по умолчанию сервер доступен по адресу [localhost:3000](http://localhost:3000):
```
npm start
```

Запуск Kurento Media Server:
```
sudo service kurento-media-server-6.0 start
```

Сборка приложения под все архитектуры, архивы для загрузки приложения будут размещены в public/dist:
```
apt-get install tar zip unzip wget upx-ucl
npm run-script build-app
```

Добавление пользователей:
```
cd ./ITMOproctor/db
node import.js users.json
```

Развертывание системы на Ubuntu 14.04 с помощью bash-скрипта:
```
chmod +x ./deploy.sh
./deploy.sh
```
