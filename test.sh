#!/bin/bash

# First login and store the full cookie (not just value)
COOKIE=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff1@test.com","password":"staff123"}' \
  -i | grep -i "set-cookie" | cut -d' ' -f2)

echo "Cookie received: $COOKIE"

# Create farmer with the stored cookie
curl -X POST http://localhost:3000/api/farmers \
  -H "Cookie: $COOKIE" \
  -F "farmerName=Aniketh" \
  -F "relationship=SELF" \
  -F "gender=MALE" \
  -F "community=General" \
  -F "aadharNumber=123456789551" \
  -F "contactNumber=9876543210" \
  -F "state=Karnataka" \
  -F "district=Bangalore Rural" \
  -F "mandal=Devanahalli" \
  -F "village=Vishwanathapura" \
  -F "panchayath=Vishwanathapura" \
  -F "dateOfBirth=1990-05-15" \
  -F "age=33" \
  -F "ifscCode=SBIN0125640" \
  -F "accountNumber=89674523145" \
  -F "branchName=Devanahalli Branch" \
  -F "bankAddress=Main Road, Devanahalli" \
  -F "bankName=State Bank of India" \
  -F "bankCode=SBI1234" \
  -F "fields=[{\"areaHa\":\"5.5\",\"yieldEstimate\":\"2000\",\"location\":\"{\\\"lat\\\":13.2468,\\\"lng\\\":77.7134}\"}]" \
  -F "profilePic=@pp.png;type=image/png" \
  -F "aadharDoc=@test_doc.pdf;type=application/pdf" \
  -F "bankDoc=@test_doc.pdf;type=application/pdf" \
  -F "fieldDoc_0=@test_doc.pdf;type=application/pdf" \
  -H "Content-Type: multipart/form-data" \
  -v