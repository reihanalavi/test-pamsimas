const tagihanModel = require('./model')
const pelangganModel = require('../pelanggan/model')
const ambangModel = require('../ambang/model')

module.exports = {
    tagihan: async (req, res) => {
        try {

            const { alamatRumah } = req.query

            if(alamatRumah) {
                const tagihan = await tagihanModel.find({
                    alamatRumah
                })

                res.status(200).json({
                    data: tagihan
                })
            } else {
                const tagihan = await tagihanModel.find()
                
                res.status(200).json({
                    data: tagihan
                })
            }

        } catch (error) {
            res.status(500).json({
                message: error.message,
                title: 'Terjadi kesalahan'
            })
        }
    },
    countNow: async (req, res) => {
        try {
            let tagihan = await tagihanModel.countDocuments()

            res.status(200).json({
                data: tagihan
            })

        } catch (error) {
            res.status(500).json({
                message: error.message,
                title: 'Terjadi kesalahan'
            })
        }
    },
    tagihanNow: async (req, res) => {
        try {

            const { alamatRumah } = req.query

            const currentDate = new Date()
            const currentMonth = currentDate.getMonth() + 1
            const currentYear = currentDate.getFullYear()

            let criteria = {
                bulanTagihan: currentMonth,
                tahunTagihan: currentYear
            }

            if(alamatRumah) {
                criteria = {
                    ...criteria,
                    alamatRumah
                }
            }

            let tagihan = await tagihanModel.find(criteria)

            res.status(200).json({
                data: tagihan
            })

        } catch (error) {
            res.status(500).json({
                message: error.message,
                title: 'Terjadi kesalahan'
            })
        }
    },
    tagihanByMonth: async (req, res) => {
        try {

            const { bulanTagihan, tahunTagihan } = req.params
            const { alamatRumah } = req.query

            let criteria = {
                bulanTagihan,
                tahunTagihan
            }

            if(alamatRumah) {
                criteria = {
                    ...criteria,
                    alamatRumah
                }
            }

            let tagihan = await tagihanModel.find(criteria)

            res.status(200).json({
                data: tagihan
            })

        } catch (error) {
            res.status(500).json({
                message: error.message,
                title: 'Terjadi kesalahan'
            })
        }
    },
    generatetagihan: async (req, res) => {
        try {
            // const { idMeteran, bulanTagihan, tahunTagihan, meteranSebelumnya, meteranSekarang } = req.body

            // Get all pelanggan
            const pelanggans = await pelangganModel.find();

            // Extract last month meteransaatini
            const currentDate = new Date()
            const currentMonth = currentDate.getMonth() + 1
            const currentYear = currentDate.getFullYear()

            for (const pelanggan of pelanggans) {
                const tagihanSebelumnya = await tagihanModel.findOne({
                    idMeteran: pelanggan.idMeteran,
                    bulanTagihan: currentMonth - 1
                })

                const meteranSebelumnya = tagihanSebelumnya ? tagihanSebelumnya.meteranSekarang : 0

                const idTagihan = `PAM-TAGIHAN-${pelanggan.idMeteran}-${currentYear}-${currentMonth}`;

                const tagihan = new tagihanModel({
                    idTagihan,
                    idMeteran: pelanggan.idMeteran,
                    alamatRumah: pelanggan.alamatRumah,
                    bulanTagihan: currentMonth,
                    tahunTagihan: currentYear,
                    meteranSebelumnya,
                    meteranSekarang: 0,
                    totalTagihan: (0).toString(),
                    statusPembayaran: 'Belum Lunas',
                    tanggalBayar: '-',
                    metodeBayar: '-'
                });
    
                await tagihan.save()
            }

            res.status(200).json({
                message: 'Berhasil menambahkan tagihan!'
            })

        } catch (error) {
            res.status(500).json({
                message: error.message,
                title: 'Terjadi kesalahan'
            })
        }
    },
    generatetagihanoncustommonth: async (req, res) => {
        try {
            const { bulanTagihan, tahunTagihan, data } = req.body

            // Get all pelanggan
            const pelanggans = await pelangganModel.find();

            for (const [index, pelanggan] of pelanggans.entries()) {

                const idTagihan = `PAM-TAGIHAN-${pelanggan.idMeteran}-${tahunTagihan}-${bulanTagihan}`;

                const tagihan = new tagihanModel({
                    idTagihan,
                    idMeteran: pelanggan.idMeteran,
                    alamatRumah: pelanggan.alamatRumah,
                    bulanTagihan,
                    tahunTagihan,
                    meteranSebelumnya: data[index].meteranSebelumnya,
                    meteranSekarang: data[index].meteranSekarang,
                    totalTagihan: data[index].totalTagihan,
                    statusPembayaran: 'Belum Lunas',
                    tanggalBayar: '-',
                    metodeBayar: '-'
                });
    
                await tagihan.save()
            }

            res.status(200).json({
                message: 'Berhasil menambahkan tagihan!'
            })

        } catch (error) {
            res.status(500).json({
                message: error.message,
                title: 'Terjadi kesalahan'
            })
        }
    },
    createtagihan: async (req, res) => {
        try {
            const { idMeteran, bulanTagihan, tahunTagihan, meteranSebelumnya, meteranSekarang } = req.body

            // Generate ID meteran
            const idTagihan = `PAM-TAGIHAN-${idMeteran}-${tahunTagihan}-${bulanTagihan}`;

            // Calculate total
            const pelanggan = await pelangganModel.findOne({
                idMeteran
            })

            const ambang = await ambangModel.findOne({
                dusunRTRW: pelanggan.alamatRumah
            })

            const meteranHitungan = meteranSekarang - meteranSebelumnya
            var totalTagihan = meteranHitungan

            let factorTotalTagihan = 0
            let biayaAdmin = 0

            // Logic penentuan harga
            if(pelanggan.jenisMeteran) {
                if(pelanggan.jenisMeteran == 'Pribadi') {
                    if(meteranHitungan < ambang.ambangMinimum.meteranPribadi) {
                        totalTagihan = ambang.ambangMinimum.meteranPribadi
                    }
                    factorTotalTagihan = ambang.hargaPerKubik.meteranPribadi
                    biayaAdmin = ambang.biayaAdmin.meteranPribadi
                } else {
                    if(meteranHitungan < ambang.ambangMinimum.meteranUsaha) {
                        totalTagihan = ambang.ambangMinimum.meteranUsaha
                    }
                    factorTotalTagihan = ambang.hargaPerKubik.meteranUsaha
                    biayaAdmin = ambang.biayaAdmin.meteranUsaha
                }
            } else {
                if(meteranHitungan < ambang.ambangMinimum.meteranPribadi) {
                    totalTagihan = ambang.ambangMinimum.meteranPribadi
                }
                factorTotalTagihan = ambang.hargaPerKubik.meteranPribadi
                biayaAdmin = ambang.biayaAdmin.meteranPribadi
            }

            // Simpan data tagihan
            const payload = {
                idTagihan,
                idMeteran,
                alamatRumah: pelanggan.alamatRumah,
                bulanTagihan,
                tahunTagihan,
                meteranSebelumnya,
                meteranSekarang,
                totalTagihan: (totalTagihan * factorTotalTagihan + biayaAdmin).toString(),
                statusPembayaran: 'Belum Lunas',
                tanggalBayar: '-',
                metodeBayar: '-'
            };

            const tagihan = new tagihanModel(payload);
            await tagihan.save()

            res.status(200).json({
                message: 'Berhasil menambahkan tagihan!',
                data: payload
            })

        } catch (error) {
            res.status(500).json({
                message: error.message,
                title: 'Terjadi kesalahan'
            })
        }
    },
    tagihanByIdTagihan: async (req, res) => {
        try {
            const { idTagihan } = req.params

            const tagihan = await tagihanModel.find({
                idTagihan
            });

            res.status(200).json({
                data: tagihan
            })

        } catch (error) {
            res.status(500).json({
                message: error.message,
                title: 'Terjadi kesalahan'
            })
        }
    },
    tagihanByIdMeteran: async (req, res) => {
        try {
            const { idMeteran } = req.params

            const tagihan = await tagihanModel.find({
                idMeteran
            });

            res.status(200).json({
                data: tagihan
            })

        } catch (error) {
            res.status(500).json({
                message: error.message,
                title: 'Terjadi kesalahan'
            })
        }
    },
    updatetagihanById: async (req, res) => {
        try {
            const { idTagihan } = req.params
            const updatedData = req.body

            if(updatedData.meteranSekarang) {
                const readTagihan = await tagihanModel.findOne({
                    idTagihan
                });

                    // Calculate total
                const pelanggan = await pelangganModel.findOne({
                    idMeteran
                })

                const ambang = await ambangModel.findOne({
                    dusunRTRW: pelanggan.alamatRumah
                })

                const meteranHitungan = meteranSekarang - readTagihan.meteranSebelumnya
                var totalTagihan = meteranHitungan

                let factorTotalTagihan = 0
                let biayaAdmin = 0

                // Logic penentuan harga
                if(pelanggan.jenisMeteran) {
                    if(pelanggan.jenisMeteran == 'Pribadi') {
                        if(meteranHitungan < ambang.ambangMinimum.meteranPribadi) {
                            totalTagihan = ambang.ambangMinimum.meteranPribadi
                        }
                        factorTotalTagihan = ambang.hargaPerKubik.meteranPribadi
                        biayaAdmin = ambang.biayaAdmin.meteranPribadi
                    } else {
                        if(meteranHitungan < ambang.ambangMinimum.meteranUsaha) {
                            totalTagihan = ambang.ambangMinimum.meteranUsaha
                        }
                        factorTotalTagihan = ambang.hargaPerKubik.meteranUsaha
                        biayaAdmin = ambang.biayaAdmin.meteranUsaha
                    }
                } else {
                    if(meteranHitungan < ambang.ambangMinimum.meteranPribadi) {
                        totalTagihan = ambang.ambangMinimum.meteranPribadi
                    }
                    factorTotalTagihan = ambang.hargaPerKubik.meteranPribadi
                    biayaAdmin = ambang.biayaAdmin.meteranPribadi
                }

                updatedData.totalTagihan = (totalTagihan * 1000).toString()
            }

            const tagihan = await tagihanModel.updateOne({
                idTagihan
            }, {
                $set: updatedData
            });

            res.status(200).json({
                message: 'Berhasil mengubah data tagihan!',
                data: tagihan
            })

        } catch (error) {
            res.status(500).json({
                message: error.message,
                title: 'Terjadi kesalahan'
            })
        }
    },
    deletetagihanById: async (req, res) => {
        try {
            const { idTagihan } = req.params

            await tagihanModel.findOneAndDelete({
                idTagihan
            });

            res.status(200).json({
                message: 'Berhasil menghapus data tagihan!'
            })

        } catch (error) {
            res.status(500).json({
                message: error.message,
                title: 'Terjadi kesalahan'
            })
        }
    },
}