/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const { discount, sale_price, quantity } = purchase;
   return sale_price * quantity * (1 - discount / 100);
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;

    if (index === 0) {
    return profit * 0.15;
    } else if (index === 1 || index === 2) {
    return profit * 0.1;
    } else if (index === (total - 1)) {
        return 0;
    } else { // Для всех остальных
        return profit * 0.05;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    if (!data
        || !Array.isArray(data.sellers)
        || !Array.isArray(data.products)
        || !Array.isArray(data.purchase_records)
        || data.sellers.length === 0
        || data.products.length === 0
        || data.purchase_records.length === 0) {
            throw new Error('Некорректные входные данные');
        }
        // @TODO: Проверка входных данных 
    

    const { calculateRevenue, calculateBonus } = options;
    // @TODO: Проверка наличия опций
    if (
        !(typeof calculateRevenue === "function")
        || !(typeof calculateBonus === "function")) {
            throw new Error('Чего-то не хватает');
        }

    const sellerStats = data.sellers.map(seller => {
        return {    
            id: seller.id,
            name: `${seller.first_name} ${seller.last_name}`,
            revenue: 0,
            profit: 0,
            sales_count: 0,
            products_sold: {}
        };
    }); // <<<--- @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerIndex = Object.fromEntries(sellerStats.map(seller => [seller.id, seller]));
    const productIndex = Object.fromEntries(data.products.map(product => [product.sku, product]));
    // @TODO: ^^^ Индексация продавцов и товаров для быстрого доступа ^^^

    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        seller.sales_count += 1;
        seller.revenue += record.total_amount;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            const cost = product.purchase_price * item.quantity;
            const revenue = calculateRevenue(item);
            const profit = revenue - cost;

            seller.profit += profit;
            //seller.products_sold[item.sku] = product; // добавить сюда этот предмет


            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            } 
            seller.products_sold[item.sku] += item.quantity;
            
        });
    });
    // @TODO: ^^^ Расчет выручки и прибыли для каждого продавца ^^^

    sellerStats.sort((seller1, seller2) => {
        if (seller1.profit > seller2.profit) {
            return -1;
        }
        if (seller1.profit < seller2.profit) {
            return 1;
        }
        return 0
    })
    // @TODO: ^^^ Сортировка продавцов по прибыли ^^^

    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);// Считаем бонус
        seller.top_products = Object.entries(seller.products_sold)
        .map(([sku, quantity]) => ({ sku, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
        
        /*seller.top_products = Object.entries(seller.products_sold)
        .map(product => [{sku: product[0], quantity: product[1]}])
        .sort((product1, product2) => {
            if (product1[0].quantity > product2[0].quantity) {
                return -1;
            }
            if (product1[0].quantity < product2[0].quantity) {
                return 1;
            }
            return 0;
        }).slice(0, 10);//);// Формируем топ-10 товаров
        //console.log(seller.top_products);*/
    });
    // @TODO: ^^^Назначение премий на основе ранжирования^^^

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id,// Строка, идентификатор продавца
        name: seller.name,// Строка, имя продавца
        revenue: +seller.revenue.toFixed(2),// Число с двумя знаками после точки, выручка продавца
        profit: +seller.profit.toFixed(2),// Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count,// Целое число, количество продаж продавца
        top_products: seller.top_products,// Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: +seller.bonus.toFixed(2)// Число с двумя знаками после точки, бонус продавца
    }));
}

/*
seller_id: seller.id,
            name: `${seller.first_name} ${seller.last_name}`,
            revenue: 0.00,
            profit: 0.00,
            sales_count: 0,
            top_products: {},
            bonus: 0
            */