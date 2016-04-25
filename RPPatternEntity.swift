//
//  RPPatternEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 08.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

struct RPPatternCell {
    
    let column: Int
    let row: Int
    
    init(column: Int, row: Int) {
        
        self.column = column
        self.row = row
    }
}

enum RPPlatformPosition: Int {
    
    case Left
    case Center
    case Right
    case numberOfPositions
}

class RPPatternEntity: RPEntity, RPPlatformEntityDelegate {

    var platformEntites: [RPPlatformEntity]
    var numberOfPlatforms: Int = 50
    var lastPlatformPositionIndex: Int = 0
    var spaceBetweenPlatforms: CGFloat = 230
    
    unowned var layerEntity: RPLayerEntity
    
    init(layerEntity: RPLayerEntity) {
        
        self.platformEntites = []
        self.layerEntity = layerEntity
        super.init()
        createPattern()
    }
    
    func didRemovePlatform(platform: RPPlatformEntity) {
        
        guard let index = self.platformEntites.indexOf(platform) else {
            fatalError("Entity not in Array!")
        }
        
        self.platformEntites.removeAtIndex(index)
    }
    
    func createPattern() {

        var xPos: CGFloat = 0
        var yPos: CGFloat = 80
        
        let platformPositionDistribution = GKShuffledDistribution(lowestValue: 0, highestValue: RPPlatformPosition.numberOfPositions.rawValue - 1)
        let heightDistribution = GKShuffledDistribution(lowestValue: -8, highestValue: 8)
        
        //let breakableDistribution = GKShuffledDistribution(lowestValue: 0, highestValue: 1)
        //let bottomCollidableDistribution = GKShuffledDistribution(lowestValue: 0, highestValue: 1)
        
        for var numberOfPlatform: Int = 1; numberOfPlatform < numberOfPlatforms + 1; ++numberOfPlatform {
            
            /**/
            
            var platformPositionIndex: Int = platformPositionDistribution.nextInt()
            
            while platformPositionIndex == lastPlatformPositionIndex {
                platformPositionIndex = platformPositionDistribution.nextInt()
            }
            
            lastPlatformPositionIndex = platformPositionIndex
             
            /**/

            let platformPosition = RPPlatformPosition(rawValue: platformPositionIndex)!

            yPos = yPos + spaceBetweenPlatforms + CGFloat(heightDistribution.nextInt())
            
            switch platformPosition {
                
                case .Left:
                    xPos = -50
                break
                
                case .Center:
                    xPos = 0
                break
                
                case .Right:
                    xPos = 50
                break
                
                default:
                break;
            }
            
            /* ------------------ */
            
            let platformEntity = RPHairRibbonPlatformEntity(isBreakable: false, isBottomCollidable: false)

            platformEntites.append(platformEntity)
            layerEntity.renderComponent.addChild(platformEntity.renderComponent.node)
            
            platformEntity.renderComponent.node.position = CGPoint(x: xPos, y: yPos)
            platformEntity.delegate = self
        }
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
        
        for entity: GKEntity in self.platformEntites {
            
            if let platformEntity = entity as? RPPlatformEntity {
                
                platformEntity.updateWithDeltaTime(seconds)
            }
        }
    }
}
