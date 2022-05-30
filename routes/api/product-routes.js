const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', (req, res) => {
    // find all products
    // be sure to include its associated Category and Tag data
    Product.findAll({
            include: [{
                model: Category
            }, {
                model: Tag,
                as: "tags"
            }]
        })
        .then(dbData => res.json(dbData))
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        });
});

// get one product
router.get('/:id', (req, res) => {
    // find a single product by its `id`
    // be sure to include its associated Category and Tag data
    Product.findOne({
            include: [{
                model: Category
            }, {
                model: Tag,
                as: "tags"
            }],
            where: {
                id: req.params.id
            }
        })
        .then(dbData => {
            if (!dbData) {
                res.status(404).json({ message: "Product not found" });
                return;
            }
            res.json(dbData)
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        });
});

// create new product
router.post('/', (req, res) => {
    Product.create({
            product_name: req.body.product_name,
            price: req.body.price,
            stock: req.body.stock,
            category_id: req.body.category_id
        })
        .then((product) => {
            // if there's product tags, we need to create pairings to bulk create in the ProductTag model
            if (req.body.tagIds && req.body.tagIds.length) {
                const productTagIdArr = req.body.tagIds.map((tag_id) => {
                    return {
                        product_id: product.id,
                        tag_id,
                    };
                });

                ProductTag.bulkCreate(productTagIdArr)
                    .then(() => {
                        return product;
                    });
            }

            return product;
        })
        .then(product => {
            return Product.findOne({
                include: [{
                    model: Category
                }, {
                    model: Tag,
                    as: "tags"
                }],
                where: {
                    id: product.id
                }
            });
        })
        .then(data => res.json(data))
        .catch((err) => {
            console.log(err);
            res.status(400).json(err);
        });
});

// update product
router.put('/:id', (req, res) => {
    // update product data
    Product.update(req.body, {
            where: {
                id: req.params.id,
            }
        })
        .then((product) => {
            // find all associated tags from ProductTag
            return ProductTag.findAll({ where: { product_id: req.params.id } });
        })
        .then((productTags) => {
            // get list of current tag_ids
            const productTagIds = productTags.map(({ tag_id }) => tag_id);
            // create filtered list of new tag_ids
            const newProductTags = req.body.tagIds
                .filter((tag_id) => !productTagIds.includes(tag_id))
                .map((tag_id) => {
                    return {
                        product_id: req.params.id,
                        tag_id,
                    };
                });
            // figure out which ones to remove
            const productTagsToRemove = productTags
                .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
                .map(({ id }) => id);

            // run both actions
            return Promise.all([
                ProductTag.destroy({ where: { id: productTagsToRemove } }),
                ProductTag.bulkCreate(newProductTags),
            ]);
        })
        .then((updatedProductTags) => res.json(updatedProductTags))
        .catch((err) => {
            // console.log(err);
            res.status(400).json(err);
        });
});

router.delete('/:id', (req, res) => {
    // delete one product by its `id` value
    Product.destroy({
            where: {
                id: req.params.id
            }
        })
        .then(dbData => {
            if (!dbData) {
                res.status(404).json({ message: 'Product not found' });
                return;
            }
            res.json(dbData);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        });
});

module.exports = router;