//
//  RPEmitterLayer.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 25.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import UIKit
import SpriteKit

class RPEmitterLayer: RPLayer {

    func random(firstNum: CGFloat, max secondNum: CGFloat) -> CGFloat{
        return CGFloat(arc4random()) / CGFloat(UINT32_MAX) * abs(firstNum - secondNum) + min(firstNum, secondNum)
    }
    
    var columnOffset = CGFloat(0.0)
    var rowOffset = CGFloat(0.0)
    var damping = CGFloat(0.0)
    var minAlpha: CGFloat = 0.0
    var maxAlpha: CGFloat = 1.0
    var particleSize: CGFloat = 5.0
    
    func populate(numberOfColumns numColumns: Int, numberOfRows numRows: Int) {
        
        columnOffset = scene!.size.width / CGFloat(numColumns)
        rowOffset = scene!.size.height / CGFloat(numRows)
        
        for var column = 0; column < numColumns; ++column {
            
            for var row = 0; row < numRows; ++row {
                
                var xPos = columnOffset * CGFloat(column)
                var yPos = rowOffset * CGFloat(row)
                
                xPos = random(xPos, max: xPos + columnOffset)
                yPos = random(yPos, max: yPos + rowOffset)
                
                let particle = RPParticleSpriteNode(color: SKColor.whiteColor(), size: CGSize(width: particleSize, height: particleSize))
                particle.damping = damping
                particle.minAlpha = minAlpha
                particle.maxAlpha = maxAlpha
                particle.setup()
                particle.position = CGPoint(x: xPos, y: yPos)
                particle.column = column
                particle.row = row
                addChild(particle)
            }
        }
        
    }
    
    override func setup() {
        
    }
    
    override func update(currentTime: NSTimeInterval) {
        
        for node: SKNode in children {
            
            let positionInScene = scene!.convertPoint(node.position, fromNode: node.parent!)
            let particleNode = node as! RPParticleSpriteNode
            
            if positionInScene.y < -(scene!.size.height / 2) {

                var xPos = columnOffset * CGFloat(particleNode.column)
                xPos = random(xPos, max: xPos + columnOffset)
                let yPos = node.position.y + scene!.size.height
                
                particleNode.position = CGPoint(x: xPos, y: yPos)
            }
            
             if positionInScene.y > (scene!.size.height / 2) {

                var xPos = columnOffset * CGFloat(particleNode.column)
                xPos = random(xPos, max: xPos + columnOffset)
                let yPos = node.position.y - scene!.size.height

                particleNode.position = CGPoint(x: xPos, y: yPos)
            }
            
            
            /*
             if positionInScene.x < -(scene!.size.width / 2) {

                node.removeFromParent()
                
                let particleNode = node as! RPParticleSpriteNode
                
                var yPos = rowOffset * CGFloat(particleNode.row)
                yPos = random(yPos, max: yPos + rowOffset)
                
                let xPos = node.position.x + scene!.size.width
                //xPos = random(xPos, max: xPos + columnOffset);
                
                let newParticleNode = RPParticleSpriteNode(color: SKColor.whiteColor(), size: CGSize(width: 2.5, height: 2.5))
                newParticleNode.damping = damping
                newParticleNode.setup()
                newParticleNode.position = CGPoint(x: xPos, y: yPos)
                newParticleNode.column = Int(newParticleNode.position.x / columnOffset)
                newParticleNode.row = particleNode.row
                addChild(newParticleNode)
            }
            
             if positionInScene.x > (scene!.size.width / 2) {
                
                node.removeFromParent()
                
                let particleNode = node as! RPParticleSpriteNode
                
                var yPos = rowOffset * CGFloat(particleNode.row)
                yPos = random(yPos, max: yPos + rowOffset)
                
                let xPos = node.position.x - scene!.size.width
                //xPos = random(xPos, max: xPos + columnOffset);
                
                let newParticleNode = RPParticleSpriteNode(color: SKColor.whiteColor(), size: CGSize(width: 2.5, height: 2.5))
                newParticleNode.damping = damping
                newParticleNode.setup()
                newParticleNode.position = CGPoint(x: xPos, y: yPos)
                newParticleNode.column = Int(newParticleNode.position.x / columnOffset)
                newParticleNode.row = particleNode.row
                addChild(newParticleNode)
            }*/
            
            
        }
    }
    
}
