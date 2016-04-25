//
//  RPParticleLayerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

//import UIKit
import SpriteKit
import GameplayKit

class RPParticleLayerEntity: RPLayerEntity {
    
    var columnOffset = CGFloat(0.0)
    var rowOffset = CGFloat(0.0)
    var damping = CGFloat(0.0)
    
    var minAlpha: CGFloat = 0.0
    var maxAlpha: CGFloat = 1.0
    var particleSize: CGFloat = 25.0
    
    init(withParallaxFactor factor: CGFloat, cameraComponent: RPCameraComponent, zPosition: CGFloat = 0.0, numberOfColumns: Int, numberOfRows: Int, damping: CGFloat = 15.0) {
        
        super.init(withParallaxFactor: factor, cameraComponent: cameraComponent, zPosition: zPosition)
        self.damping = damping
        populate(numberOfColumns: numberOfColumns, numberOfRows: numberOfRows)
        
        self.name = "RPParticleLayerEntity"
    }
    
    func random(firstNum: CGFloat, max secondNum: CGFloat) -> CGFloat {
        return CGFloat(arc4random()) / CGFloat(UINT32_MAX) * abs(firstNum - secondNum) + min(firstNum, secondNum)
    }
    
    func populate(numberOfColumns numColumns: Int, numberOfRows numRows: Int) {
        
        columnOffset = RPGameSceneSettings.width / CGFloat(numColumns)
        rowOffset = RPGameSceneSettings.height / CGFloat(numRows)
        
        for var column = 0; column < numColumns; ++column {
            
            for var row = 0; row < numRows; ++row {
                
                var xPos = (columnOffset * CGFloat(column)) - 682
                var yPos = rowOffset * CGFloat(row)
                
                xPos = random(xPos, max: xPos + columnOffset)
                yPos = random(yPos, max: yPos + rowOffset)
                
                let particle = RPParticleSpriteNode(color: SKColor.greenColor(), size: CGSize(width: particleSize, height: particleSize))
                
                particle.damping = damping
                particle.minAlpha = minAlpha
                particle.maxAlpha = maxAlpha
                particle.setup()
                particle.position = CGPoint(x: xPos, y: yPos)
                particle.column = column
                particle.row = row
                particle.lightingBitMask = 1
                
                renderComponent.addChild(particle)
            }
        }
        
    }

    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        
        super.updateWithDeltaTime(seconds)
        
        for node: SKNode in renderComponent.node.children {
            
            let positionInScene = renderComponent.node.scene!.convertPoint(node.position, fromNode: node.parent!)
            let particleNode = node as! RPParticleSpriteNode
            
            node.physicsBody?.applyForce(CGVector(dx: 0.5, dy: 0.0))
            
            if positionInScene.y < 0 {
                
                var xPos = columnOffset * CGFloat(particleNode.column)
                xPos -= 682
                xPos = random(xPos, max: xPos + columnOffset)
                let yPos = node.position.y + renderComponent.node.scene!.size.height
                
                particleNode.position = CGPoint(x: xPos, y: yPos)
            }
            
            if positionInScene.y > RPGameSceneSettings.height {
                
                var xPos = columnOffset * CGFloat(particleNode.column)
                xPos -= 682
                xPos = random(xPos, max: xPos + columnOffset)
                let yPos = node.position.y - renderComponent.node.scene!.size.height
                
                particleNode.position = CGPoint(x: xPos, y: yPos)
            }
        }
    }
}
