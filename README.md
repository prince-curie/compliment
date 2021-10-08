# laravel_test
## Task
 Implement an Authentication service, with 1. Registration 2. Login 3. Token generation for subsequent actions 4. Fetch user's data. This should be implemented in Laravel (lumen) your work will be judged based on 5 criteria.

1. Does it work?
2. Code Quality,
3. Unit test coverage (>70%)
4. API Documentation 
5. Use of best practice

## Documentation
To read the documentation [follow this link](https://laraveltest3.docs.apiary.io/#)

## Installation
### Install locally on your machine
- Ensure you have installed on your machine:
  - PHP server
  - Apache server
  - Mysql server

#### Clone this repo

```bash
$ git clone https://github.com/prince-curie/test_laravel.git
$ cd test_laravel
```

#### Install dependencies

```bash
$ composer install
```

#### Start the server

starting the server locally on your machine

```bash
$ php -S localhost:8000 -t public
```
Also start your database server

#### Generate APP KEY
  - hit the endpoint `localhost:8000/key` to generate a 32 bit key
  - copy the open open your env file and place it as the velue to `APP_KEY`

#### GENERATE JWT SECRET
- run `php artisan jwt:secret`
 
## Test
- To run test
```bash
$ php vendor/phpunit/phpunit/phpunit 
```

